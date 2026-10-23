import { NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.NEXT_PUBLIC_META_VERIFY_TOKEN || 'glopro_webhook_token';

/**
 * 1. GET: Webhook Verification Endpoint (Meta Facebook/Instagram, WhatsApp, Zalo Challenge)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Meta Webhook Verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden: Verify token mismatch', { status: 403 });
    }
  }

  // Telegram / Zalo check status
  const channel = searchParams.get('channel') || 'all';
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/social-chat/webhook',
    channel,
    timestamp: new Date().toISOString(),
    supportedChannels: ['zalo', 'facebook', 'instagram', 'whatsapp', 'telegram']
  });
}

/**
 * 2. POST: Webhook Ingestion Router (Normalize multi-channel payloads)
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryChannel = searchParams.get('channel');
    const body = await request.json().catch(() => ({}));

    let normalized = null;

    // A. MÔ PHỎNG / TEST LOCAL (Direct simulation from UI modal)
    if (body.is_simulation || body.simulate) {
      normalized = {
        id: `sim_${Date.now()}`,
        channel: body.channel || queryChannel || 'zalo',
        externalSenderId: body.externalSenderId || `ext_${Date.now()}`,
        customerName: body.customerName || 'Khách Hàng Mới',
        phone: body.phone || '0988 888 999',
        avatar: body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: body.text || 'Xin chào salon, em muốn hỏi dịch vụ cắt tóc và uốn',
        language: body.language || 'vi',
        isNewCustomer: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    // B. FACEBOOK MESSENGER & INSTAGRAM DIRECT (Meta Graph API)
    else if (body.object === 'page' || body.object === 'instagram') {
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];
      const senderId = messaging?.sender?.id;
      const messageText = messaging?.message?.text || '';

      normalized = {
        id: messaging?.message?.mid || `meta_${Date.now()}`,
        channel: body.object === 'instagram' ? 'instagram' : 'facebook',
        externalSenderId: senderId,
        customerName: `Khách ${body.object === 'instagram' ? 'Instagram' : 'Facebook'} (${senderId?.slice(-4) || 'User'})`,
        phone: '',
        text: messageText,
        language: 'vi',
        isNewCustomer: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    // C. ZALO OA (Zalo OpenAPI Webhook)
    else if (body.event_name === 'user_send_text' || body.app_id) {
      const senderId = body.sender?.id || body.user_id_by_app;
      const messageText = body.message?.text || '';

      normalized = {
        id: body.message?.msg_id || `zl_${Date.now()}`,
        channel: 'zalo',
        externalSenderId: senderId,
        customerName: body.sender?.name || `Khách Zalo OA (${senderId?.slice(-4) || 'User'})`,
        phone: body.sender?.phone || '',
        text: messageText,
        language: 'vi',
        isNewCustomer: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    // D. TELEGRAM BOT API
    else if (body.update_id && body.message) {
      const from = body.message.from;
      const senderId = String(from.id);
      const customerName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Khách Telegram';
      const messageText = body.message.text || '';

      normalized = {
        id: `tg_${body.message.message_id}`,
        channel: 'telegram',
        externalSenderId: senderId,
        customerName,
        phone: '',
        text: messageText,
        language: from.language_code === 'ja' ? 'ja' : 'vi',
        isNewCustomer: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    // E. WHATSAPP CLOUD API
    else if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      const change = body.entry[0].changes[0].value;
      const msg = change.messages[0];
      const contact = change.contacts?.[0];
      const senderPhone = msg.from;

      normalized = {
        id: msg.id || `wa_${Date.now()}`,
        channel: 'whatsapp',
        externalSenderId: senderPhone,
        customerName: contact?.profile?.name || `Khách WhatsApp (+${senderPhone})`,
        phone: senderPhone,
        text: msg.text?.body || '',
        language: 'vi',
        isNewCustomer: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    // F. GENERIC / FALLBACK
    else {
      normalized = {
        id: `msg_${Date.now()}`,
        channel: queryChannel || 'facebook',
        externalSenderId: body.sender_id || `user_${Date.now()}`,
        customerName: body.customer_name || 'Khách Mạng Xã Hội',
        phone: body.phone || '',
        text: body.text || body.message || 'Tin nhắn mới',
        language: body.language || 'vi',
        isNewCustomer: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // Tự động nhận diện ngôn ngữ
    const rawText = normalized.text || '';
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(rawText)) {
      normalized.language = 'ja';
    } else if (/[가-힣]/.test(rawText)) {
      normalized.language = 'ko';
    } else if (/^[a-zA-Z0-9\s.,!?'"-]+$/.test(rawText) && rawText.split(' ').length > 2) {
      normalized.language = 'en';
    }

    // Chuẩn bị kịch bản tin nhắn chào mừng thông minh (Welcome message)
    let welcomeReply = null;
    if (normalized.language === 'ja') {
      welcomeReply = {
        textVi: 'Dạ GloPro Salon xin kính chào quý khách! Cảm ơn bạn đã liên hệ, bạn có cần hỗ trợ tư vấn dịch vụ hay đặt lịch hẹn không ạ?',
        textJa: 'こんにちは！GloProサロンへようこそ。ヘアケアやご予約など、どのようなご用件でしょうか？'
      };
    } else if (normalized.language === 'en') {
      welcomeReply = {
        textVi: 'Dạ GloPro Salon xin kính chào quý khách! Bạn cần tư vấn dịch vụ hay đặt lịch hẹn hôm nay ạ?',
        textJa: 'Hello! Welcome to GloPro Salon. How may we assist you with our services or booking today?'
      };
    } else {
      welcomeReply = {
        textVi: 'Dạ GloPro Salon xin kính chào quý khách! Cảm ơn bạn đã nhắn tin cho salon, bạn đang quan tâm dịch vụ nào bên mình ạ?',
        textJa: 'GloProサロンにお問い合わせいただきありがとうございます！どのメニューをご希望でしょうか？'
      };
    }

    return NextResponse.json({
      success: true,
      channel: normalized.channel,
      normalizedMessage: normalized,
      welcomeReply,
      receivedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[SocialChat Webhook Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
