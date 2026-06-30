import type { Messages } from './en';

/** Vietnamese catalog. Must provide exactly the keys defined by `en`. */
export const vi: Messages = {
  'app.name': 'Redact',

  'options.title': 'Bộ lọc Redact',
  'options.language': 'Ngôn ngữ',
  'options.addPreset': 'Thêm bộ lọc',
  'options.noPresets': 'Chưa có bộ lọc nào. Thêm một bộ để bắt đầu.',

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
  'popup.presetsForSite': 'Bộ lọc cho {host}',
  'popup.noPresetsForSite': 'Không có bộ lọc nào khớp với trang này.',
  'popup.openOptions': 'Quản lý bộ lọc',

  'overlay.message': 'Đang che dữ liệu…',
};
