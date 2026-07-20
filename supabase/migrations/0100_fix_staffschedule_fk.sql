-- Fix foreign key constraint for staffschedule.shift_template_id
ALTER TABLE staffschedule DROP CONSTRAINT IF EXISTS fk_staffschedule_shift_template_id;
ALTER TABLE staffschedule ADD CONSTRAINT fk_staffschedule_shift_template_id FOREIGN KEY (shift_template_id) REFERENCES shifttemplate(id) ON DELETE SET NULL;
