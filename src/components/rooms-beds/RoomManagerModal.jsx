'use client';

import React, { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { X, Plus, Edit3, Trash2, Building2, Check, DoorOpen } from 'lucide-react';
import { toast } from '@/components/Layout';

const ROOM_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#64748B', // Slate
  '#14B8A6'  // Teal
];

export default function RoomManagerModal({
  open,
  onClose,
  branchId,
  branches = [],
  allRooms = [],
  allBeds = [],
  onSaveRoom,
  onUpdateRoom,
  onDeleteRoom,
  initialEditingRoom = null
}) {
  const { t } = useT();
  const [name, setName] = useState('');
  const [color, setColor] = useState(ROOM_COLORS[0]);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset form when modal opens or initialEditingRoom changes
  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setName('');
      setColor(ROOM_COLORS[0]);
      setTargetBranchId('');
      return;
    }

    if (initialEditingRoom) {
      setEditingId(initialEditingRoom.id);
      setName(initialEditingRoom.name || '');
      setColor(initialEditingRoom.color || ROOM_COLORS[0]);
      setTargetBranchId(initialEditingRoom.branch_id || (branchId !== 'all' ? branchId : (branches[0]?.id || '')));
    } else {
      setEditingId(null);
      setName('');
      setColor(ROOM_COLORS[0]);
      setTargetBranchId(branchId !== 'all' ? branchId : (branches[0]?.id || ''));
    }
  }, [open, initialEditingRoom, branchId, branches]);

  if (!open) return null;

  // Filter rooms to display: if viewing a specific branch, show rooms of this branch + unassigned branch
  const displayRooms = branchId === 'all'
    ? allRooms
    : allRooms.filter(r => !r.branch_id || r.branch_id === branchId);

  const handleStartEdit = (room) => {
    setEditingId(room.id);
    setName(room.name || '');
    setColor(room.color || ROOM_COLORS[0]);
    setTargetBranchId(room.branch_id || (branchId !== 'all' ? branchId : (branches[0]?.id || '')));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setColor(ROOM_COLORS[0]);
    setTargetBranchId(branchId !== 'all' ? branchId : (branches[0]?.id || ''));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return toast.error(t('rooms_beds.err_room_name', 'Vui lòng nhập tên phòng'));
    }

    const assignedBranch = targetBranchId || (branchId !== 'all' ? branchId : (branches[0]?.id || null));

    try {
      setSubmitting(true);
      if (editingId) {
        // Update existing room
        await onUpdateRoom?.(editingId, {
          name: trimmedName,
          color,
          branch_id: assignedBranch
        });
        toast.success(t('rooms_beds.msg_room_updated', 'Đã cập nhật phòng'));
      } else {
        // Create new room
        await onSaveRoom?.({
          name: trimmedName,
          color,
          branch_id: assignedBranch
        });
        toast.success(t('rooms_beds.msg_room_added', 'Đã thêm phòng mới'));
      }

      // Reset form fields
      setName('');
      setColor(ROOM_COLORS[0]);
      setEditingId(null);
    } catch (err) {
      toast.error(t('rooms_beds.err_save_room', 'Lỗi khi lưu phòng: ') + (err?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room) => {
    const bedsInRoom = allBeds.filter(b => b.room_id === room.id);
    let confirmMsg = '';

    if (bedsInRoom.length > 0) {
      confirmMsg = t(
        'rooms_beds.confirm_delete_room_with_beds',
        `Xoá phòng "${room.name}"? ${bedsInRoom.length} vị trí (giường/ghế) trong phòng này sẽ được chuyển thành "Chưa phân phòng".`
      );
    } else {
      confirmMsg = t(
        'rooms_beds.confirm_delete_room',
        `Bạn có chắc chắn muốn xoá phòng "${room.name}" không?`
      );
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await onDeleteRoom?.(room.id);
      if (editingId === room.id) {
        handleCancelEdit();
      }
      toast.success(t('rooms_beds.msg_room_deleted', 'Đã xoá phòng thành công'));
    } catch (err) {
      toast.error(t('rooms_beds.err_delete_room', 'Lỗi khi xoá phòng: ') + (err?.message || ''));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 text-left flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {t('rooms_beds.manage_rooms', 'Quản lý phòng')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('rooms_beds.manage_rooms_desc', 'Tạo mới, chỉnh sửa và sắp xếp các phòng trong salon')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form: Add or Edit Room */}
        <form onSubmit={handleSave} className="space-y-3.5 mb-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {editingId ? t('rooms_beds.edit_room', 'Chỉnh sửa phòng') : t('rooms_beds.add_room', 'Thêm phòng mới')}
            </span>
            {editingId && (
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {t('rooms_beds.editing_badge', 'Đang sửa')}
              </span>
            )}
          </div>

          {/* Room Name Input */}
          <div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rooms_beds.room_name_placeholder', 'Nhập tên phòng (VD: Phòng Spa VIP, Chăm sóc da...)')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:bg-white text-slate-800 bg-white shadow-2xs transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              {t('rooms_beds.choose_color', 'Màu sắc nhận diện')}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ROOM_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : 'hover:scale-105'
                  }`}
                  style={{ background: c }}
                  title={c}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Selection (if in 'all' view with multiple branches) */}
          {branchId === 'all' && branches.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {t('rooms_beds.apply_branch', 'Thuộc chi nhánh')}
              </label>
              <select
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-blue-500"
              >
                {branches.filter(b => b.id !== 'all').map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-1 flex flex-col gap-1.5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {editingId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('rooms_beds.btn_update_room', 'Cập nhật phòng')}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t('rooms_beds.btn_add_room', 'Thêm phòng')}</span>
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {t('common.cancel_edit', 'Huỷ chỉnh sửa')}
              </button>
            )}
          </div>
        </form>

        {/* Existing Rooms List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('rooms_beds.room_list', 'Danh sách phòng')} ({displayRooms.length})
            </h3>
            {branchId !== 'all' && (
              <span className="text-[11px] text-slate-400">
                {branches.find(b => b.id === branchId)?.name}
              </span>
            )}
          </div>

          {displayRooms.length === 0 ? (
            <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <DoorOpen className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p>{t('rooms_beds.empty_rooms', 'Chưa có phòng nào')}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Nhập tên phòng ở trên để tạo phòng đầu tiên.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {displayRooms.map((room) => {
                const bedsInThisRoom = allBeds.filter(b => b.room_id === room.id);
                const isSelectedForEdit = editingId === room.id;

                return (
                  <div
                    key={room.id}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
                      isSelectedForEdit
                        ? 'border-blue-400 bg-blue-50/70 shadow-2xs'
                        : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Room Color indicator */}
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ background: room.color || '#3B82F6' }}
                    />

                    {/* Room Details */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {room.name}
                        </span>
                        {branchId === 'all' && room.branch_id && (
                          <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                            {branches.find(b => b.id === room.branch_id)?.name || 'Chi nhánh'}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-500 bg-white border border-slate-200/70 px-2 py-0.5 rounded-lg shrink-0">
                        {bedsInThisRoom.length} {t('rooms_beds.unit_bed', 'vị trí')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(room)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title={t('common.edit', 'Chỉnh sửa')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(room)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={t('common.delete', 'Xoá')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
