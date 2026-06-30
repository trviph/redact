import type { Messages } from './en';

/** Vietnamese catalog. Must provide exactly the keys defined by `en`. */
export const vi: Messages = {
  'app.name': 'Redact',

  'options.language': 'Ngôn ngữ',

  'list.title': 'Bộ lọc Redact',
  'list.empty': 'Chưa có bộ lọc nào. Thêm một bộ để bắt đầu.',
  'list.addPreset': 'Thêm bộ lọc',
  'list.activeHere': 'Đang áp dụng',
  'list.pausedHere': 'Tạm dừng',
  'list.prev': 'Trước',
  'list.next': 'Sau',
  'list.pageOf': 'Trang {page} trên {count}',

  'editor.newTitle': 'Bộ lọc mới',
  'editor.editTitle': 'Sửa bộ lọc',
  'editor.back': 'Về danh sách',

  'preset.name': 'Tên',
  'preset.namePlaceholder': 'ví dụ: Ẩn dữ liệu khách hàng',
  'preset.domains': 'Tên miền',
  'preset.domainsHint': 'Mỗi dòng một tên miền. Cho phép ký tự đại diện, ví dụ example.com hoặc *.app.com',
  'preset.enabled': 'Đang bật',
  'preset.rules': 'Quy tắc',
  'preset.addRule': 'Thêm quy tắc',
  'preset.save': 'Lưu',
  'preset.edit': 'Sửa',
  'preset.delete': 'Xóa',
  'preset.cancel': 'Hủy',

  'rule.selector': 'Bộ chọn',
  'rule.selectorPlaceholder': 'ví dụ: .secret hoặc //div[@class="secret"]',
  'rule.selectorType': 'Loại',
  'rule.typeCss': 'CSS',
  'rule.typeXpath': 'XPath',
  'rule.description': 'Mô tả',
  'rule.descriptionPlaceholder': 'Ghi chú tùy chọn',
  'rule.remove': 'Bỏ',

  'popup.title': 'Redact',

  'overlay.message': 'Đang che dữ liệu…',
};
