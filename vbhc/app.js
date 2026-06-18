const types = [
  ["Nghị quyết (cá biệt)", "NQ", true],
  ["Quyết định (cá biệt) - trực tiếp", "QĐ", true],
  ["Quyết định (cá biệt) - gián tiếp", "QĐ", true],
  ["Chỉ thị", "CT", true],
  ["Quy chế", "QC", true],
  ["Quy định", "QyĐ", true],
  ["Thông cáo", "TC", true],
  ["Thông báo", "TB", true],
  ["Hướng dẫn", "HD", true],
  ["Chương trình", "CTr", true],
  ["Kế hoạch", "KH", true],
  ["Phương án", "PA", true],
  ["Đề án", "ĐA", true],
  ["Dự án", "DA", true],
  ["Báo cáo", "BC", true],
  ["Biên bản", "BB", true],
  ["Tờ trình", "TTr", true],
  ["Hợp đồng", "HĐ", true],
  ["Công văn", "", false],
  ["Công điện", "CĐ", true],
  ["Bản ghi nhớ", "BGN", true],
  ["Bản thỏa thuận", "BTT", true],
  ["Giấy ủy quyền", "GUQ", true],
  ["Giấy mời", "GM", true],
  ["Giấy giới thiệu", "GGT", true],
  ["Giấy nghỉ phép", "GNP", true],
  ["Phiếu gửi", "PG", true],
  ["Phiếu chuyển", "PC", true],
  ["Phiếu báo", "PB", true],
  ["Phụ lục văn bản hành chính giấy", "", true],
  ["Phụ lục văn bản hành chính điện tử", "", true],
  ["Bản sao sang định dạng giấy", "", true],
  ["Bản sao sang định dạng điện tử", "", true],
  ["Sổ đăng ký văn bản đi", "", true],
  ["Bì văn bản", "", true],
  ["Sổ gửi văn bản đi bưu điện", "", true],
  ["Sổ sử dụng bản lưu", "", true],
  ["Dấu đến", "", true],
  ["Sổ đăng ký văn bản đến", "", true],
  ["Phiếu giải quyết văn bản đến", "", true],
  ["Sổ theo dõi giải quyết văn bản đến", "", true],
  ["Danh mục hồ sơ", "", true],
  ["Mục lục hồ sơ, tài liệu nộp lưu", "", true],
  ["Mục lục văn bản, tài liệu trong hồ sơ", "", true],
  ["Biên bản giao nhận hồ sơ, tài liệu", "", true]
];

const ids = [
  "docType", "docNo", "agencyCode", "urgency", "parentAgency", "issuingAgency",
  "draftingCode", "place", "issuedDate", "headerRatio", "pageOrientation", "summary", "attachedDocumentTitle", "issuingAuthority", "recipients", "basis", "bodyText",
  "tableText", "tableAfterText",
  "signMode", "signTitle", "signName", "archiveLine", "copyTo"
];

const $ = (id) => document.getElementById(id);
const blankDocNo = "\u00a0".repeat(7);
const blankDayMonth = "\u00a0".repeat(2);
const blankYear = "\u00a0".repeat(4);

const documentTemplates = {
  "Nghị quyết (cá biệt)": {
    summary: "Về việc ...",
    issuingAuthority: "THẨM QUYỀN BAN HÀNH",
    basis: "Căn cứ ...;\nCăn cứ ...;",
    bodyText: "Nội dung nghị quyết.\n... /.",
    copyTo: "Như Điều;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Quyết định (cá biệt) - trực tiếp": {
    summary: "Về việc ...",
    issuingAuthority: "THẨM QUYỀN BAN HÀNH",
    basis: "Căn cứ ...;\nCăn cứ ...;\nTheo đề nghị của ...;",
    bodyText: "Điều 1. ...\nĐiều 2. ...\n... /.",
    copyTo: "Như Điều;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Quyết định (cá biệt) - gián tiếp": {
    summary: "Ban hành ...",
    attachedDocumentTitle: "Quy chế ...",
    issuingAuthority: "THẨM QUYỀN BAN HÀNH",
    basis: "Căn cứ ...;\nCăn cứ ...;\nTheo đề nghị của ...;",
    bodyText: "Điều 1. Ban hành kèm theo Quyết định này ...\nĐiều 2. ...\n... /.",
    copyTo: "Như Điều;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Công văn": {
    summary: "...",
    recipients: "...\n...",
    basis: "",
    bodyText: "................................................................................................\n................................................................................................\n................................................................................................\n.............................................................................................. /.",
    copyTo: "Như Điều ...;\nLưu: VT, ...",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Công điện": {
    summary: "...",
    basis: "",
    bodyText: "Tên cơ quan, tổ chức hoặc chức danh của người đứng đầu điện:\n- ...;\n- ...;\nNội dung điện.\n... /.",
    copyTo: "Như trên;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Giấy mời": {
    summary: "...",
    basis: "",
    bodyText: "Tên cơ quan, tổ chức ban hành giấy mời trân trọng kính mời: ...\nTới dự: ...\nChủ trì: ...\nThời gian: ...\nĐịa điểm: ...\nCác vấn đề cần lưu ý: ... /.",
    copyTo: "...;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Giấy giới thiệu": {
    summary: "",
    basis: "",
    bodyText: "Tên cơ quan, tổ chức ban hành văn bản trân trọng giới thiệu:\nÔng (bà): ...\nChức vụ: ...\nĐược cử đến: ...\nVề việc: ...\nĐề nghị Quý cơ quan tạo điều kiện để ông (bà) có tên ở trên hoàn thành nhiệm vụ.\nGiấy này có giá trị đến hết ngày ... /.",
    copyTo: "Như trên;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Biên bản": {
    summary: "Tên cuộc họp hoặc hội nghị, hội thảo",
    basis: "",
    bodyText: "Thời gian bắt đầu: ...\nĐịa điểm: ...\nThành phần tham dự: ...\nChủ trì (chủ tọa): ...\nThư ký (người ghi biên bản): ...\nNội dung (theo diễn biến cuộc họp/hội nghị/hội thảo): ...\nCuộc họp (hội nghị, hội thảo) kết thúc vào ... giờ ..., ngày ... tháng ... năm ... /.",
    copyTo: "...;\nLưu: VT, Hồ sơ.",
    signTitle: "CHỦ TỌA"
  },
  "Giấy nghỉ phép": {
    summary: "",
    basis: "Xét Đơn đề nghị nghỉ phép ngày ... của ông (bà) ...;",
    bodyText: "Cấp cho:\nÔng (bà): ...\nChức vụ: ...\nĐược nghỉ phép trong thời gian kể từ ngày ... đến hết ngày ... tại ...\nSố ngày nghỉ phép nêu trên được tính vào thời gian ... /.\nXác nhận của cơ quan (tổ chức) hoặc chính quyền địa phương nơi nghỉ phép (nếu cần): ...",
    copyTo: "...;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  },
  "Phụ lục văn bản hành chính giấy": {
    summary: "Tiêu đề phụ lục",
    basis: "(Kèm theo Văn bản số ... ngày ... tháng ... năm ... của ...)",
    bodyText: "Nội dung của phụ lục.\n... /.",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Phụ lục văn bản hành chính điện tử": {
    summary: "Tiêu đề phụ lục",
    basis: "Số: ...; ngày/tháng/năm; giờ: phút: giây\n(Kèm theo Văn bản số ... ngày ... tháng ... năm ... của ...)",
    bodyText: "Nội dung của phụ lục.\n... /.",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Bản sao sang định dạng giấy": {
    summary: "Tên loại văn bản được sao",
    basis: "Hình thức sao: SAO Y / SAO LỤC / TRÍCH SAO",
    bodyText: "Nội dung văn bản được sao.\n... /.",
    copyTo: "...;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ BẢN SAO"
  },
  "Bản sao sang định dạng điện tử": {
    summary: "Tên loại văn bản được sao",
    basis: "Hình thức sao; tên cơ quan thực hiện sao; thời gian ký số.",
    bodyText: "Nội dung văn bản được sao.\n... /.",
    copyTo: "...;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ BẢN SAO"
  },
  "Sổ đăng ký văn bản đi": {
    summary: "Sổ đăng ký văn bản đi",
    basis: "Năm: ...\nTừ ngày ... đến ngày ...\nTừ số ... đến số ...\nQuyển số: ...",
    bodyText: "Nội dung đăng ký văn bản đi tối thiểu gồm 10 nội dung:\n1. Số, ký hiệu văn bản\n2. Ngày tháng văn bản\n3. Tên loại và trích yếu nội dung văn bản\n4. Người ký\n5. Nơi nhận văn bản\n6. Đơn vị, người nhận bản lưu\n7. Số lượng bản\n8. Ngày chuyển\n9. Ký nhận\n10. Ghi chú",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Bì văn bản": {
    summary: "Bì văn bản",
    basis: "Tên cơ quan, tổ chức\nĐịa chỉ: ...\nĐiện thoại: ... Fax: ...\nE-mail: ... Website: ...",
    bodyText: "Số/ký hiệu văn bản: ...\nKính gửi: ...",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Sổ gửi văn bản đi bưu điện": {
    summary: "Sổ gửi văn bản đi bưu điện",
    basis: "Năm: ...\nTừ ngày ... đến ngày ...\nTừ số ... đến số ...\nQuyển số: ...",
    bodyText: "Nội dung đăng ký gửi văn bản đi bưu điện tối thiểu gồm 06 nội dung:\n1. Ngày chuyển\n2. Số, ký hiệu văn bản\n3. Nơi nhận văn bản\n4. Số lượng bì\n5. Ký nhận và dấu bưu điện\n6. Ghi chú",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Sổ sử dụng bản lưu": {
    summary: "Sổ sử dụng bản lưu",
    basis: "Năm: ...\nTừ ngày ... đến ngày ...\nTừ số ... đến số ...\nQuyển số: ...",
    bodyText: "Nội dung đăng ký sử dụng bản lưu tối thiểu gồm 09 nội dung:\n1. Ngày tháng\n2. Họ tên người sử dụng\n3. Số, ký hiệu ngày tháng văn bản\n4. Tên loại và trích yếu nội dung văn bản\n5. Số và ký hiệu hồ sơ\n6. Ký nhận\n7. Ngày trả\n8. Người cho phép sử dụng\n9. Ghi chú",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Dấu đến": {
    summary: "Mẫu dấu ĐẾN",
    basis: "Kích thước: 35mm x 50mm",
    bodyText: "TÊN CƠ QUAN, TỔ CHỨC\nĐẾN\nSố: ...\nNgày: ...\nChuyển: ...\nSố và ký hiệu HS: ...",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Sổ đăng ký văn bản đến": {
    summary: "Sổ đăng ký văn bản đến",
    basis: "Năm: ...\nTừ ngày ... đến ngày ...\nTừ số ... đến số ...\nQuyển số: ...",
    bodyText: "Nội dung đăng ký văn bản đến tối thiểu gồm 10 nội dung:\n1. Ngày đến\n2. Số đến\n3. Tác giả\n4. Số, ký hiệu văn bản\n5. Ngày tháng văn bản\n6. Tên loại và trích yếu nội dung văn bản\n7. Đơn vị hoặc người nhận\n8. Ngày chuyển\n9. Ký nhận\n10. Ghi chú",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Phiếu giải quyết văn bản đến": {
    summary: "Phiếu giải quyết văn bản đến",
    basis: "(Tên loại; số và ký hiệu; ngày, tháng, năm; cơ quan ban hành và trích yếu nội dung văn bản đến)",
    bodyText: "1. Ý kiến của lãnh đạo cơ quan, tổ chức\n- Giao đơn vị, cá nhân chủ trì;\n- Giao các đơn vị, cá nhân tham gia phối hợp giải quyết văn bản đến (nếu có);\n- Thời hạn giải quyết đối với mỗi đơn vị, cá nhân (nếu có);\n- Ngày tháng cho ý kiến phân phối, giải quyết.\n2. Ý kiến của lãnh đạo đơn vị\n- Giao cho cá nhân; thời hạn giải quyết đối với cá nhân (nếu có);\n- Ngày, tháng, năm cho ý kiến.\n3. Ý kiến đề xuất của người giải quyết\n- Ý kiến đề xuất giải quyết văn bản đến của cá nhân;\n- Ngày, tháng, năm đề xuất ý kiến.",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Sổ theo dõi giải quyết văn bản đến": {
    summary: "Sổ theo dõi giải quyết văn bản đến",
    basis: "Năm: ...\nTừ ngày ... đến ngày ...\nQuyển số: ...",
    bodyText: "Nội dung đăng ký theo dõi giải quyết văn bản đến tối thiểu gồm 07 nội dung:\n1. Số đến\n2. Tên loại, số, ký hiệu, ngày, tháng và tên cơ quan, tổ chức ban hành văn bản\n3. Đơn vị hoặc người nhận\n4. Thời hạn giải quyết\n5. Tiến độ giải quyết\n6. Số, ký hiệu văn bản trả lời\n7. Ghi chú",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Danh mục hồ sơ": {
    summary: "Danh mục hồ sơ",
    basis: "Năm ...\n(Kèm theo Quyết định số ... ngày ... tháng ... năm ... của ...)",
    bodyText: "Bảng danh mục gồm các cột:\n1. Số và ký hiệu hồ sơ\n2. Tên đề mục và tiêu đề hồ sơ\n3. Thời hạn bảo quản\n4. Người lập hồ sơ\n5. Ghi chú\nI. TÊN ĐỀ MỤC LỚN\n1. Tên đề mục nhỏ\n01.TCCB | Tiêu đề hồ sơ | 20 năm | Họ và tên\nDanh mục hồ sơ này có ... hồ sơ, bao gồm ... hồ sơ bảo quản vĩnh viễn; ... hồ sơ bảo quản có thời hạn.",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Mục lục hồ sơ, tài liệu nộp lưu": {
    summary: "Mục lục hồ sơ, tài liệu nộp lưu",
    basis: "",
    bodyText: "Bảng mục lục gồm các cột:\n1. Số TT\n2. Số, ký hiệu hồ sơ\n3. Tiêu đề hồ sơ\n4. Thời gian tài liệu\n5. Thời hạn bảo quản\n6. Số tờ / Số trang\n7. Ghi chú\nMục lục này gồm: ... hồ sơ (đơn vị bảo quản).\nViết bằng chữ: ... hồ sơ (đơn vị bảo quản).\n..., ngày ... tháng ... năm ...\nNgười lập\n(Ký và ghi rõ họ và tên, chức vụ)",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Mục lục văn bản, tài liệu trong hồ sơ": {
    summary: "Mục lục văn bản, tài liệu",
    basis: "Số, ký hiệu hồ sơ: ...\nNăm ...",
    bodyText: "Bảng mục lục gồm các cột:\n1. STT\n2. Số, ký hiệu văn bản\n3. Ngày tháng năm văn bản\n4. Tên loại và trích yếu nội dung văn bản\n5. Tác giả văn bản\n6. Tờ số / Trang số\n7. Ghi chú",
    copyTo: "",
    signTitle: "",
    hideSignature: true
  },
  "Biên bản giao nhận hồ sơ, tài liệu": {
    summary: "Giao nhận hồ sơ, tài liệu",
    basis: "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;\nCăn cứ Danh mục hồ sơ năm ..., Kế hoạch thu thập tài liệu ...;",
    bodyText: "Chúng tôi gồm:\nBÊN GIAO: (tên cá nhân, đơn vị giao nộp hồ sơ, tài liệu)\nÔng (bà): ...\nChức vụ công tác: ...\nBÊN NHẬN: (Lưu trữ cơ quan)\nÔng (bà): ...\nChức vụ công tác: ...\nThống nhất lập biên bản giao nhận tài liệu với những nội dung như sau:\n1. Tên khối tài liệu giao nộp: ...\n2. Thời gian của hồ sơ, tài liệu: ...\n3. Số lượng tài liệu:\na) Đối với hồ sơ, tài liệu giấy\n- Tổng số hộp (cặp): ...\n- Tổng số hồ sơ (đơn vị bảo quản): ... Quy ra mét giá: ... mét.\nb) Đối với hồ sơ, tài liệu điện tử\n- Tổng số hồ sơ: ...\n- Tổng số tệp tin trong hồ sơ: ...\n4. Tình trạng tài liệu giao nộp: ...\n5. Mục lục hồ sơ, tài liệu nộp lưu kèm theo.\nBiên bản này được lập thành hai bản; bên giao giữ một bản, bên nhận giữ một bản./.",
    copyTo: "",
    signTitle: "",
    handoverSignature: true
  },
  default: {
    summary: "...",
    basis: "",
    bodyText: "Nội dung văn bản.\n... /.",
    copyTo: "Như Điều;\nLưu: VT.",
    signTitle: "QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ"
  }
};

const templateTables = {
  "Sổ đăng ký văn bản đi": {
    rows: [
      ["Số, ký hiệu văn bản", "Ngày tháng văn bản", "Tên loại và trích yếu nội dung văn bản", "Người ký", "Nơi nhận văn bản", "Đơn vị, người nhận bản lưu", "Số lượng bản", "Ngày chuyển", "Ký nhận", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)", "(8)", "(9)", "(10)"],
      ["...", "...", "...", "...", "...", "...", "...", "...", "...", ""],
      ["", "", "", "", "", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [11, 10, 20, 9, 11, 12, 8, 8, 6, 5]
  },
  "Sổ gửi văn bản đi bưu điện": {
    rows: [
      ["Ngày chuyển", "Số, ký hiệu văn bản", "Nơi nhận văn bản", "Số lượng bì", "Ký nhận và dấu bưu điện", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)"],
      ["...", "...", "...", "...", "...", ""],
      ["", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [14, 18, 28, 12, 18, 10]
  },
  "Sổ sử dụng bản lưu": {
    rows: [
      ["Ngày tháng", "Họ tên người sử dụng", "Số, ký hiệu ngày tháng văn bản", "Tên loại và trích yếu nội dung văn bản", "Số và ký hiệu hồ sơ", "Ký nhận", "Ngày trả", "Người cho phép sử dụng", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)", "(8)", "(9)"],
      ["...", "...", "...", "...", "...", "...", "...", "...", ""],
      ["", "", "", "", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [10, 13, 15, 22, 12, 7, 7, 10, 4]
  },
  "Sổ đăng ký văn bản đến": {
    rows: [
      ["Ngày đến", "Số đến", "Tác giả", "Số, ký hiệu văn bản", "Ngày tháng văn bản", "Tên loại và trích yếu nội dung văn bản", "Đơn vị hoặc người nhận", "Ngày chuyển", "Ký nhận", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)", "(8)", "(9)", "(10)"],
      ["...", "...", "...", "...", "...", "...", "...", "...", "...", ""],
      ["", "", "", "", "", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [8, 7, 10, 13, 10, 22, 12, 8, 5, 5]
  },
  "Sổ theo dõi giải quyết văn bản đến": {
    rows: [
      ["Số đến", "Tên loại, số, ký hiệu, ngày, tháng và tên cơ quan, tổ chức ban hành văn bản", "Đơn vị hoặc người nhận", "Thời hạn giải quyết", "Tiến độ giải quyết", "Số, ký hiệu văn bản trả lời", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)"],
      ["...", "...", "...", "...", "...", "...", ""],
      ["", "", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [8, 31, 14, 13, 13, 13, 8]
  },
  "Danh mục hồ sơ": {
    rows: [
      ["Số và ký hiệu hồ sơ", "Tên đề mục và tiêu đề hồ sơ", "Thời hạn bảo quản", "Người lập hồ sơ", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)"],
      ["", "I. TÊN ĐỀ MỤC LỚN", "", "", ""],
      ["", "1. Tên đề mục nhỏ", "", "", ""],
      ["01.TCCB", "Tiêu đề hồ sơ", "20 năm", "Họ và tên", ""],
      ["", "", "", "", ""]
    ],
    headerRows: 1,
    boldRows: [2, 3],
    widths: [14, 37, 18, 16, 15],
    after: [
      "Danh mục hồ sơ này có .................. hồ sơ, bao gồm:",
      ".................. hồ sơ bảo quản vĩnh viễn;",
      ".................. hồ sơ bảo quản có thời hạn."
    ]
  },
  "Mục lục hồ sơ, tài liệu nộp lưu": {
    rows: [
      ["Số TT", "Số, ký hiệu hồ sơ", "Tiêu đề hồ sơ", "Thời gian tài liệu", "Thời hạn bảo quản", "Số tờ³ / Số trang⁴", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)"],
      ["", "", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [8, 16, 26, 14, 14, 12, 10],
    subjectHtml: '................<sup>2</sup>................<br><span>Năm ...</span>',
    hideBasis: true,
    after: [
      { text: "Mục lục này gồm: ................................. hồ sơ (đơn vị bảo quản).", align: "left", indent: 18 },
      { text: "Viết bằng chữ: ................................... hồ sơ (đơn vị bảo quản).", align: "left", indent: 18 },
      { text: "............ ngày ........ tháng ............ năm ....", align: "center", italic: true },
      { text: "Người lập", align: "center" },
      { text: "(Ký và ghi rõ họ và tên, chức vụ)", align: "center", italic: true }
    ]
  },
  "Mục lục văn bản, tài liệu trong hồ sơ": {
    rows: [
      ["STT", "Số, ký hiệu văn bản", "Ngày tháng năm văn bản", "Tên loại và trích yếu nội dung văn bản", "Tác giả văn bản", "Tờ số / Trang số", "Ghi chú"],
      ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)"],
      ["1", "...", "...", "...", "...", "...", ""],
      ["2", "...", "...", "...", "...", "...", ""],
      ["", "", "", "", "", "", ""]
    ],
    headerRows: 1,
    widths: [7, 16, 15, 28, 14, 10, 10]
  }
};

function init() {
  const select = $("docType");
  types.forEach(([name, abbr]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = abbr ? `${name} (${abbr})` : name;
    select.appendChild(option);
  });
  select.value = "Công văn";
  const saved = localStorage.getItem("nd30-draft");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      ids.forEach((id) => {
        if (data[id] !== undefined) {
          $(id).value = id === "docType" && data[id] === "Quyết định (cá biệt)"
            ? "Quyết định (cá biệt) - trực tiếp"
            : data[id];
        }
      });
    } catch {
      localStorage.removeItem("nd30-draft");
    }
  }
  $("docNo").value = "";
  $("issuedDate").value = "";
  loadTableDefaultsForCurrentType(false);

  ids.forEach((id) => $(id).addEventListener("input", render));
  $("docType").addEventListener("change", () => loadTemplateForCurrentType());
  if ($("templateBtn")) $("templateBtn").addEventListener("click", () => loadTemplateForCurrentType());
  $("saveBtn").addEventListener("click", saveDraft);
  $("exportBtn").addEventListener("click", exportWord);
  $("resetBtn").addEventListener("click", resetDraft);
  render();
}

function currentTemplate() {
  return documentTemplates[value("docType")] || documentTemplates.default;
}

function loadTemplateForCurrentType() {
  const template = currentTemplate();
  Object.entries(template).forEach(([id, content]) => {
    if ($(id) && typeof content === "string") $(id).value = content;
  });
  loadTableDefaultsForCurrentType(true);
  if (isIndirectDecisionDocument() && value("attachedDocumentTitle")) {
    $("summary").value = "Ban hành " + value("attachedDocumentTitle");
  }
  render();
}

function getType() {
  const name = $("docType").value;
  const [typeName, abbr, hasTitle] = types.find(([item]) => item === name) || types.find(([item]) => item === "Công văn");
  const displayName = typeName
    .replace(/\s*\(cá biệt\)(?:\s*-\s*(?:trực tiếp|gián tiếp))?/i, "")
    .replace(/\s*\(quy định gián tiếp\)/i, "");
  return { typeName, displayName, abbr, hasTitle };
}

function value(id) {
  return $(id).value.trim();
}

function rawValue(id) {
  return $(id).value;
}

function lines(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(iso) {
  const date = iso ? new Date(`${iso}T00:00:00`) : new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `ngày ${day} tháng ${month} năm ${year}`;
}

function blankIssuedDate() {
  return `ngày ${blankDayMonth} tháng ${blankDayMonth} năm ${blankYear}`;
}

function issuedDateText() {
  return value("issuedDate") ? formatDate(value("issuedDate")) : blankIssuedDate();
}

function formattedDocNo() {
  const number = value("docNo");
  return number ? String(Number(number)).padStart(2, "0") : blankDocNo;
}

function docNumber() {
  const { abbr, hasTitle } = getType();
  const agency = value("agencyCode").toUpperCase();
  if (value("docType") === "Công văn") {
    const drafting = value("draftingCode").toUpperCase();
    return `Số: ${formattedDocNo()}/${agency}${drafting ? `-${drafting}` : ""}`;
  }
  if (!hasTitle) return `Số: ${formattedDocNo()}/${agency}`;
  if (!abbr) return `Số: ${formattedDocNo()}/${agency}`;
  return `Số: ${formattedDocNo()}/${abbr}-${agency}`;
}

function renderParagraphs(target, text, italic = false) {
  target.classList.toggle("italic", italic);
  target.innerHTML = lines(text).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function articleLineParts(line) {
  const match = line.match(/^(Điều\s+\d+[a-zA-ZÀ-ỹ]*\.)\s*(.*)$/i);
  if (!match) return null;
  return { label: match[1], rest: match[2] };
}

function renderBodyParagraph(line) {
  const article = isDecisionDocument() ? articleLineParts(line) : null;
  if (!article) return `<p>${escapeHtml(line)}</p>`;
  const rest = article.rest ? ` ${escapeHtml(article.rest)}` : "";
  return `<p><strong>${escapeHtml(article.label)}</strong>${rest}</p>`;
}

function currentTemplateTable() {
  return templateTables[value("docType")];
}

function tableRowsToText(rows) {
  return rows.map((row) => row.join(" | ")).join("\n");
}

function tableAfterToText(after = []) {
  return after.map((item) => typeof item === "string" ? item : item.text).join("\n");
}

function loadTableDefaultsForCurrentType(force = false) {
  const table = currentTemplateTable();
  if (!table) {
    if (force) {
      $("tableText").value = "";
      $("tableAfterText").value = "";
    }
    return;
  }

  const rawTableText = rawValue("tableText").trim();
  const isLegacyAppendixThreeTable = value("docType") === "Mục lục hồ sơ, tài liệu nộp lưu"
    && /^1\s*\|\s*\.\.\./m.test(rawTableText)
    && /^2\s*\|\s*\.\.\./m.test(rawTableText);
  if (force || !rawTableText || isLegacyAppendixThreeTable) {
    $("tableText").value = tableRowsToText(table.rows.slice(2));
  }
  if (force || !rawValue("tableAfterText").trim()) {
    $("tableAfterText").value = tableAfterToText(table.after);
  }
}

function parsedTableRows(table) {
  const columnCount = table.rows[0].length;
  const bodyRows = lines(rawValue("tableText")).map((line) => {
    const cells = line.split("|").map((cell) => cell.trim());
    return Array.from({ length: columnCount }, (_, index) => cells[index] || "");
  });
  return [...table.rows.slice(0, 2), ...bodyRows];
}

function renderedTable() {
  const table = currentTemplateTable();
  if (!table) return null;
  const afterLines = lines(rawValue("tableAfterText"));
  return {
    ...table,
    rows: parsedTableRows(table),
    after: afterLines.map((text, index) => {
      const original = table.after?.[index];
      return typeof original === "object" ? { ...original, text } : text;
    })
  };
}

function renderBodyContent() {
  const target = $("previewBody");
  const table = renderedTable();
  if (!table) {
    target.classList.remove("italic");
    target.innerHTML = lines(value("bodyText")).map(renderBodyParagraph).join("");
    return;
  }

  target.classList.remove("italic");
  target.innerHTML = [
    renderHtmlTable(table),
    ...(table.after || []).map(renderHtmlTableNote)
  ].join("");
}

function renderHtmlTableNote(item) {
  const note = typeof item === "string" ? { text: item, align: "left" } : item;
  const classes = ["table-note", note.align ? `align-${note.align}` : "", note.italic ? "italic-note" : ""]
    .filter(Boolean)
    .join(" ");
  const style = note.indent ? ` style="--note-indent:${note.indent}mm"` : "";
  return `<p class="${classes}"${style}>${escapeHtml(note.text)}</p>`;
}

function renderHtmlTable(table) {
  const compactClass = table.rows[0]?.length > 7 ? " compact" : "";
  const colgroup = table.widths
    ? `<colgroup>${table.widths.map((width) => `<col style="width:${width}%">`).join("")}</colgroup>`
    : "";
  const rows = table.rows.map((row, rowIndex) => {
    const cells = row.map((cell) => {
      const tag = rowIndex < (table.headerRows || 0) ? "th" : "td";
      const bold = table.boldRows?.includes(rowIndex) ? " strong" : "";
      return `<${tag} class="${bold.trim()}">${escapeHtml(cell)}</${tag}>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<table class="form-table${compactClass}">${colgroup}<tbody>${rows}</tbody></table>`;
}

function renderRecipients() {
  const target = $("previewRecipients");
  const recipientLines = lines(value("recipients"));
  const isDispatchLike = ["Công văn", "Tờ trình", "Báo cáo"].includes(value("docType"));
  const isOfficialLetter = value("docType") === "Công văn";
  target.classList.toggle("official-letter-recipients", isOfficialLetter);
  $("recipientBlock").style.display = isDispatchLike ? "grid" : "none";
  if (!isDispatchLike || recipientLines.length === 0) {
    target.innerHTML = "";
    return;
  }

  if (recipientLines.length === 1) {
    target.innerHTML = `<p>Kính gửi: ${escapeHtml(recipientLines[0].replace(/[.;]$/, ""))}</p>`;
    return;
  }

  target.innerHTML = [
    "<p>Kính gửi:</p>",
    `<div class="to-list">${recipientLines.map((line, index) => {
      const end = index === recipientLines.length - 1 ? "." : ";";
      return `<p>- ${escapeHtml(line.replace(/[.;]$/, ""))}${end}</p>`;
    }).join("")}</div>`
  ].join("");
}

function renderCopyTo() {
  const copyLines = lines(value("copyTo"));
  const hasArchive = copyLines.some((line) => /^lưu\s*:/i.test(line));
  if (!hasArchive && value("archiveLine")) {
    copyLines.push(`Lưu: ${value("archiveLine").replace(/[.;]$/, "")}`);
  }
  $("previewCopyTo").innerHTML = copyLines.map((line, index) => {
    const clean = line.replace(/[.;]$/, "");
    const end = index === copyLines.length - 1 ? "." : ";";
    return `<p>- ${escapeHtml(clean)}${end}</p>`;
  }).join("");
}

function renderChecks() {
  const items = [];
  const needsAuthority = hasIssuingAuthority();
  items.push(["ok", "A4 dọc"]);
  items.push(["ok", "Lề: 32 / 18 / 22mm"]);
  items.push(["ok", "Times New Roman"]);
  items.push([value("summary") ? "ok" : "warn", value("summary") ? "Có trích yếu" : "Thiếu trích yếu"]);
  if (needsAuthority) {
    items.push([value("issuingAuthority") ? "ok" : "warn", value("issuingAuthority") ? "Có thẩm quyền" : "Thiếu thẩm quyền"]);
  }
  items.push([value("signName") ? "ok" : "warn", value("signName") ? "Có người ký" : "Thiếu người ký"]);
  items.push([value("agencyCode") ? "ok" : "warn", value("agencyCode") ? "Có ký hiệu cơ quan" : "Thiếu ký hiệu cơ quan"]);
  if (value("docType") === "Công văn") {
    items.push([value("draftingCode") ? "ok" : "warn", value("draftingCode") ? "Có mã đơn vị soạn thảo" : "Thiếu mã đơn vị soạn thảo"]);
  }
  $("checks").innerHTML = items
    .map(([state, text]) => `<span class="check ${state}">${text}</span>`)
    .join("");
}

function render() {
  const { displayName, hasTitle } = getType();
  const isOfficialLetter = value("docType") === "Công văn";
  const needsAuthority = hasIssuingAuthority();
  const command = commandLabel();
  const minutes = isMinutesDocument();
  const handover = isHandoverDocument();
  const hideStandardSignature = Boolean(currentTemplate().hideSignature) || minutes || handover;
  const hasTable = Boolean(currentTemplateTable());
  if (!hasTable) $("pageOrientation").value = "portrait";
  applyHeaderRatio();
  applyPageOrientation();
  $("paper").classList.toggle("official-letter", isOfficialLetter);
  $("bodyTextBlock").style.display = hasTable ? "none" : "grid";
  $("draftingCodeBlock").style.display = isOfficialLetter ? "grid" : "none";
  $("tableTextBlock").style.display = hasTable ? "grid" : "none";
  $("tableAfterBlock").style.display = hasTable ? "grid" : "none";
  $("pageOrientationBlock").style.display = hasTable ? "grid" : "none";
  $("previewParent").textContent = value("parentAgency").toUpperCase();
  $("previewAgency").textContent = value("issuingAgency").toUpperCase();
  $("previewNumber").textContent = docNumber();
  $("previewDate").textContent = `${value("place") || "..."}, ${issuedDateText()}`;
  $("previewUrgency").innerHTML = value("urgency") ? `<span>${escapeHtml(value("urgency"))}</span>` : "";

  $("subjectBlock").style.display = hasTitle ? "block" : "none";
  $("subjectBlock").classList.toggle("table-template", Boolean(hasTable));
  $("previewDispatchSummary").style.display = isOfficialLetter ? "block" : "none";
  $("previewDocType").textContent = displayName;
  $("attachedBlock").style.display = isIndirectDecisionDocument() ? "grid" : "none";
  if (hasTable && currentTemplateTable().subjectHtml) {
    $("previewSummary").innerHTML = currentTemplateTable().subjectHtml;
  } else {
    $("previewSummary").textContent = titleSummary();
  }
  $("authorityBlock").style.display = needsAuthority ? "grid" : "none";
  $("previewAuthority").style.display = needsAuthority ? "block" : "none";
  $("previewAuthority").textContent = value("issuingAuthority").toUpperCase();
  $("previewDecisionCommand").style.display = command ? "block" : "none";
  $("previewDecisionCommand").textContent = command;
  $("previewDispatchSummary").textContent = `V/v ${value("summary")}`;

  renderRecipients();
  $("previewBasis").style.display = hasTable && currentTemplateTable().hideBasis ? "none" : "block";
  renderParagraphs($("previewBasis"), value("basis"), !isOfficialLetter);
  renderBodyContent();
  renderCopyTo();

  const signMode = value("signMode");
  const signTitle = value("signTitle").toUpperCase();
  $("previewSignMode").innerHTML = `${escapeHtml(signMode ? `${signMode} ${signTitle}` : signTitle)}`;
  $("previewSignatureNote").textContent = isOfficialLetter
    ? "(Chữ ký của người có thẩm quyền,\ndấu/chữ ký số của cơ quan, tổ chức)"
    : "";
  $("previewSignatureNote").style.display = isOfficialLetter ? "block" : "none";
  $("previewSignName").textContent = value("signName");
  $("previewMinutesSignatures").style.display = minutes ? "grid" : "none";
  $("previewHandoverSignatures").style.display = handover ? "grid" : "none";
  document.querySelector(".signature-row").style.display = hideStandardSignature ? "none" : "grid";

  renderChecks();
}

function headerRatio() {
  const ratio = Number(value("headerRatio")) || 61;
  return Math.min(72, Math.max(52, ratio));
}

function applyHeaderRatio() {
  const right = headerRatio();
  const left = 100 - right;
  const docTop = document.querySelector(".doc-top");
  docTop.style.gridTemplateColumns = `${left}% ${right}%`;
  $("headerRatioValue").textContent = String(right);
}

function isLandscape() {
  return value("pageOrientation") === "landscape";
}

function applyPageOrientation() {
  $("paper").classList.toggle("landscape", isLandscape());
  document.body.classList.toggle("print-landscape", isLandscape());
}

function isDecisionDocument() {
  return value("docType").startsWith("Quyết định (cá biệt)");
}

function isIndirectDecisionDocument() {
  return value("docType") === "Quyết định (cá biệt) - gián tiếp";
}

function isResolutionDocument() {
  return value("docType") === "Nghị quyết (cá biệt)";
}

function isMinutesDocument() {
  return value("docType") === "Biên bản";
}

function isHandoverDocument() {
  return value("docType") === "Biên bản giao nhận hồ sơ, tài liệu";
}

function hasIssuingAuthority() {
  return isDecisionDocument() || isResolutionDocument();
}

function commandLabel() {
  if (isDecisionDocument()) return "QUYẾT ĐỊNH:";
  if (isResolutionDocument()) return "QUYẾT NGHỊ:";
  return "";
}

function titleSummary() {
  if (isIndirectDecisionDocument()) {
    const attached = value("attachedDocumentTitle") || value("summary");
    return `Ban hành ${attached}`;
  }
  return value("summary");
}

function draftData() {
  return Object.fromEntries(ids.map((id) => [id, $(id).value]));
}

function saveDraft() {
  localStorage.setItem("nd30-draft", JSON.stringify(draftData()));
  showToast("Đã lưu nháp");
  renderChecks();
}

function showToast(message) {
  let toast = $("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

function resetDraft() {
  localStorage.removeItem("nd30-draft");
  window.location.reload();
}

function exportWord() {
  render();
  const blob = buildDocx();
  const link = document.createElement("a");
  const safeName = value("docType")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "van-ban";
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}-${String(Number(value("docNo")) || 1).padStart(2, "0")}.docx`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function buildDocx() {
  const documentXml = buildDocumentXml();
  const files = {
    "[Content_Types].xml": contentTypesXml(),
    "_rels/.rels": rootRelsXml(),
    "word/document.xml": documentXml,
    "word/_rels/document.xml.rels": documentRelsXml(),
    "word/styles.xml": stylesXml()
  };
  return new Blob([createZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
}

function buildDocumentXml() {
  const { displayName, hasTitle } = getType();
  const tableTemplate = currentTemplateTable();
  const needsAuthority = hasIssuingAuthority();
  const command = commandLabel();
  const minutes = isMinutesDocument();
  const handover = isHandoverDocument();
  const hideStandardSignature = Boolean(currentTemplate().hideSignature) || minutes || handover;
  const isDispatchLike = ["Công văn", "Tờ trình", "Báo cáo"].includes(value("docType"));
  const recipientLines = lines(value("recipients"));
  const copyLines = lines(value("copyTo"));
  const hasArchive = copyLines.some((line) => /^lưu\s*:/i.test(line));
  if (!hideStandardSignature && !hasArchive && value("archiveLine")) {
    copyLines.push(`Lưu: ${value("archiveLine").replace(/[.;]$/, "")}`);
  }

  const parts = [];
  parts.push(docxHeaderTable());
  if (value("urgency")) {
    parts.push(paragraph(value("urgency"), { color: "B91C1C", bold: true, size: 26, spacingBefore: 120, spacingAfter: 80 }));
  } else if (value("docType") === "Công văn") {
    parts.push(paragraph("", { spacingAfter: 0, line: 680 }));
  } else {
    parts.push(paragraph("", { spacingAfter: 120 }));
  }

  if (hasTitle) {
    parts.push(paragraph(displayName.toUpperCase(), { align: "center", bold: true, size: 28, spacingAfter: 0 }));
    if (tableTemplate?.subjectHtml) {
      parts.push(...docxSubjectHtml(tableTemplate.subjectHtml));
    } else {
      parts.push(paragraph(titleSummary(), { align: "center", bold: true, size: 28, spacingAfter: 0 }));
    }
    parts.push(paragraph("__________________", { align: "center", size: 24, spacingAfter: 180 }));
    if (needsAuthority && value("issuingAuthority")) {
      parts.push(paragraph(value("issuingAuthority").toUpperCase(), { align: "center", bold: true, size: 26, spacingAfter: 160 }));
    }
  }

  if (isDispatchLike && recipientLines.length > 0) {
    const officialLetter = value("docType") === "Công văn";
    const headingOptions = officialLetter
      ? { size: 28, line: 324, indentLeft: 1724, spacingBefore: 454, spacingAfter: 0 }
      : { size: 28, line: 324, spacingAfter: 0 };
    const recipientIndent = officialLetter ? 2744 : 1440;
    if (recipientLines.length === 1) {
      parts.push(paragraph(
        `Kính gửi: ${recipientLines[0].replace(/[.;]$/, "")}`,
        { ...headingOptions, spacingAfter: 283 }
      ));
    } else {
      parts.push(paragraph("Kính gửi:", headingOptions));
      recipientLines.forEach((line, index) => {
        const end = index === recipientLines.length - 1 ? "." : ";";
        parts.push(paragraph(`- ${line.replace(/[.;]$/, "")}${end}`, {
          size: 28,
          line: 324,
          indentLeft: recipientIndent,
          spacingAfter: index === recipientLines.length - 1 && officialLetter ? 283 : 0
        }));
      });
      if (!officialLetter) parts.push(paragraph("", { spacingAfter: 120 }));
    }
  }

  if (!tableTemplate?.hideBasis) {
    const officialLetter = value("docType") === "Công văn";
    lines(value("basis")).forEach((line) => {
      parts.push(paragraph(line, {
        italic: !officialLetter,
        justify: true,
        firstLine: 567,
        size: 28,
        line: 324,
        spacingAfter: 120
      }));
    });
  }
  if (command) {
    parts.push(paragraph(command, { align: "center", bold: true, size: 28, spacingBefore: 160, spacingAfter: 120 }));
  }
  parts.push(docxBodyContent());
  if (minutes) {
    parts.push(minutesSignatureTable());
    parts.push(receiversOnly(copyLines));
  } else if (handover) {
    parts.push(handoverSignatureTable());
  } else if (hideStandardSignature) {
    if (copyLines.length) parts.push(receiversOnly(copyLines));
  } else {
    parts.push(paragraph("", { spacingAfter: 0, line: 680 }));
    parts.push(signatureTable(copyLines));
  }
  parts.push(sectionProperties());

  return xmlDocument(parts.join(""));
}

function docxBodyContent() {
  const table = renderedTable();
  if (!table) {
    return lines(value("bodyText"))
      .map((line) => docxBodyParagraph(line, {
        justify: true,
        firstLine: 567,
        size: 28,
        line: 324,
        spacingAfter: 120
      }))
      .join("");
  }

  return [
    docxFormTable(table),
    ...(table.after || []).map(docxTableNote)
  ].join("");
}

function docxBodyParagraph(line, options = {}) {
  const article = isDecisionDocument() ? articleLineParts(line) : null;
  if (!article) return paragraph(line, options);
  return paragraphRuns([
    { text: article.label, bold: true },
    { text: article.rest ? ` ${article.rest}` : "" }
  ], options);
}

function docxSubjectHtml(html) {
  return html
    .replace(/<sup>(.*?)<\/sup>/g, "$1")
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .map((line) => paragraph(line, { align: "center", size: 26, spacingAfter: 0, italic: /^Năm\b/i.test(line) }));
}

function docxTableNote(item) {
  const note = typeof item === "string" ? { text: item, align: "left", indent: 18 } : item;
  const indentLeft = note.indent ? Math.round(note.indent * 56.7) : 0;
  return paragraph(note.text, {
    align: note.align === "center" ? "center" : undefined,
    indentLeft: note.align === "center" ? 0 : indentLeft,
    italic: note.italic,
    size: 28,
    spacingAfter: 80
  });
}

function docxFormTable(table) {
  const totalWidth = contentWidthDxa();
  const widths = table.widths.map((width) => Math.round(totalWidth * width / 100));
  const cellSize = table.rows[0]?.length > 7 ? 18 : 24;
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  const rows = table.rows.map((row, rowIndex) => {
    const cells = row.map((cell, cellIndex) => docxTableCell(cell, {
      width: widths[cellIndex],
      bold: rowIndex < (table.headerRows || 0) || table.boldRows?.includes(rowIndex),
      align: cellIndex === 1 && rowIndex >= (table.headerRows || 0) ? "left" : "center",
      size: cellSize
    })).join("");
    return `<w:tr>${cells}</w:tr>`;
  }).join("");

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${totalWidth}" w:type="dxa"/>
        <w:tblBorders>${singleBorderXml()}</w:tblBorders>
        <w:tblLayout w:type="fixed"/>
      </w:tblPr>
      <w:tblGrid>${grid}</w:tblGrid>
      ${rows}
    </w:tbl>`;
}

function docxTableCell(text, options = {}) {
  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${options.width}" w:type="dxa"/>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      ${paragraph(text, { align: options.align || "center", bold: options.bold, size: options.size || 24, spacingAfter: 0 })}
    </w:tc>`;
}

function docxHeaderTable() {
  const totalWidth = contentWidthDxa() - 100;
  const rightWidth = Math.round(totalWidth * headerRatio() / 100);
  const leftWidth = totalWidth - rightWidth;
  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${totalWidth}" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>${noBorderXml()}</w:tblBorders>
        ${zeroCellMarginsXml()}
      </w:tblPr>
      <w:tblGrid><w:gridCol w:w="${leftWidth}"/><w:gridCol w:w="${rightWidth}"/></w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="${leftWidth}" w:type="dxa"/></w:tcPr>
          ${paragraph(value("parentAgency").toUpperCase(), { align: "center", size: 24, line: 240, spacingAfter: 0 })}
          ${paragraph(value("issuingAgency").toUpperCase(), { align: "center", bold: true, size: 24, line: 240, spacingAfter: 0 })}
          ${paragraph("_____________", { align: "center", size: 22, line: 240, spacingAfter: 120 })}
          ${paragraph(docNumber(), { align: "center", size: 26, line: 240, spacingAfter: 0 })}
          ${value("docType") === "Công văn"
            ? paragraph(`V/v ${value("summary")}`, { align: "center", size: 24, line: 240, spacingBefore: 120, spacingAfter: 0 })
            : ""}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="${rightWidth}" w:type="dxa"/><w:noWrap/></w:tcPr>
          ${paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { align: "center", bold: true, size: 24, line: 240, spacingAfter: 0 })}
          ${paragraph("Độc lập - Tự do - Hạnh phúc", { align: "center", bold: true, size: 28, line: 240, spacingAfter: 0 })}
          ${paragraph("________________________", { align: "center", size: 22, line: 240, spacingAfter: 120 })}
          ${paragraph(`${value("place") || "..."}, ${issuedDateText()}`, { align: "center", italic: true, size: 26, line: 240, spacingAfter: 0 })}
        </w:tc>
      </w:tr>
    </w:tbl>`;
}

function minutesSignatureTable() {
  return `
    <w:tbl>
      <w:tblPr><w:tblW w:w="9071" w:type="dxa"/><w:tblBorders>${noBorderXml()}</w:tblBorders></w:tblPr>
      <w:tblGrid><w:gridCol w:w="4355"/><w:gridCol w:w="4355"/></w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4355" w:type="dxa"/></w:tcPr>
          ${paragraph("THƯ KÝ", { align: "center", bold: true, size: 28, spacingAfter: 0 })}
          ${paragraph("(Chữ ký)", { align: "center", italic: true, size: 24, spacingAfter: 480 })}
          ${paragraph("Họ và tên", { align: "center", bold: true, size: 28, spacingAfter: 0 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4355" w:type="dxa"/></w:tcPr>
          ${paragraph("CHỦ TỌA", { align: "center", bold: true, size: 28, spacingAfter: 0 })}
          ${paragraph("(Chữ ký của người có thẩm quyền, dấu/chữ ký số của cơ quan, tổ chức nếu có)", { align: "center", italic: true, size: 24, spacingAfter: 480 })}
          ${paragraph("Họ và tên", { align: "center", bold: true, size: 28, spacingAfter: 0 })}
        </w:tc>
      </w:tr>
    </w:tbl>`;
}

function handoverSignatureTable() {
  return `
    <w:tbl>
      <w:tblPr><w:tblW w:w="9071" w:type="dxa"/><w:tblBorders>${noBorderXml()}</w:tblBorders></w:tblPr>
      <w:tblGrid><w:gridCol w:w="4355"/><w:gridCol w:w="4355"/></w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4355" w:type="dxa"/></w:tcPr>
          ${paragraph("ĐẠI DIỆN BÊN GIAO", { align: "center", bold: true, size: 28, spacingAfter: 0 })}
          ${paragraph("(Ký và ghi rõ họ và tên)", { align: "center", italic: true, size: 24, spacingAfter: 720 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4355" w:type="dxa"/></w:tcPr>
          ${paragraph("ĐẠI DIỆN BÊN NHẬN", { align: "center", bold: true, size: 28, spacingAfter: 0 })}
          ${paragraph("(Ký và ghi rõ họ và tên)", { align: "center", italic: true, size: 24, spacingAfter: 720 })}
        </w:tc>
      </w:tr>
    </w:tbl>`;
}

function receiversOnly(copyLines) {
  return [
    paragraph("Nơi nhận:", { bold: true, italic: true, size: 24, spacingBefore: 160, spacingAfter: 0 }),
    ...copyLines.map((line, index) => {
      const clean = line.replace(/[.;]$/, "");
      const end = index === copyLines.length - 1 ? "." : ";";
      return paragraph(`- ${clean}${end}`, { size: 22, spacingAfter: 0 });
    })
  ].join("");
}

function signatureTable(copyLines) {
  const signMode = value("signMode");
  const signTitle = value("signTitle").toUpperCase();
  const signLine = signMode ? `${signMode} ${signTitle}` : signTitle;
  const receivers = [
    paragraph("Nơi nhận:", { bold: true, italic: true, size: 24, spacingAfter: 0 }),
    ...copyLines.map((line, index) => {
      const clean = line.replace(/[.;]$/, "");
      const end = index === copyLines.length - 1 ? "." : ";";
      return paragraph(`- ${clean}${end}`, { size: 22, spacingAfter: 0 });
    })
  ].join("");

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9000" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>${noBorderXml()}</w:tblBorders>
        ${zeroCellMarginsXml()}
      </w:tblPr>
      <w:tblGrid><w:gridCol w:w="4510"/><w:gridCol w:w="4490"/></w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4510" w:type="dxa"/></w:tcPr>
          ${receivers}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4490" w:type="dxa"/></w:tcPr>
          ${paragraph(signLine, { align: "center", bold: true, size: 28, spacingAfter: 0 })}
          ${value("docType") === "Công văn"
            ? [
                paragraph("(Chữ ký của người có thẩm quyền,", { align: "center", italic: true, size: 24, spacingAfter: 0 }),
                paragraph("dấu/chữ ký số của cơ quan, tổ chức)", { align: "center", italic: true, size: 24, spacingAfter: 0 })
              ].join("")
            : ""}
          ${blankSignatureSpace()}
          ${paragraph(value("signName"), { align: "center", bold: true, size: 28, spacingAfter: 0 })}
        </w:tc>
      </w:tr>
    </w:tbl>`;
}

function blankSignatureSpace() {
  return Array.from({ length: 4 }, () => paragraph("", {
    align: "center",
    size: 28,
    spacingAfter: 0,
    line: 360
  })).join("");
}

function paragraph(text, options = {}) {
  const align = options.justify ? "both" : options.align;
  const pPr = paragraphProperties(options, align);
  const rPr = runProperties(options);
  return `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function paragraphRuns(runs, options = {}) {
  const align = options.justify ? "both" : options.align;
  const pPr = paragraphProperties(options, align);
  const content = runs
    .filter((run) => run.text)
    .map((run) => {
      const rPr = runProperties({ ...options, ...run });
      return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(run.text)}</w:t></w:r>`;
    })
    .join("");
  return `<w:p><w:pPr>${pPr}</w:pPr>${content}</w:p>`;
}

function paragraphProperties(options, align) {
  return [
    align ? `<w:jc w:val="${align}"/>` : "",
    options.spacingBefore || options.spacingAfter !== undefined || options.line
      ? `<w:spacing w:before="${options.spacingBefore || 0}" w:after="${options.spacingAfter || 0}"${options.line ? ` w:line="${options.line}" w:lineRule="exact"` : ""}/>`
      : "",
    options.firstLine || options.indentLeft
      ? `<w:ind${options.firstLine ? ` w:firstLine="${options.firstLine}"` : ""}${options.indentLeft ? ` w:left="${options.indentLeft}"` : ""}/>`
      : ""
  ].join("");
}

function runProperties(options) {
  const rPr = [
    '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>',
    options.bold ? "<w:b/>" : "",
    options.italic ? "<w:i/>" : "",
    options.color ? `<w:color w:val="${options.color}"/>` : "",
    `<w:sz w:val="${options.size || 28}"/>`,
    `<w:szCs w:val="${options.size || 28}"/>`
  ].join("");
  return rPr;
}

function sectionProperties() {
  const landscape = isLandscape();
  const pageWidth = landscape ? 16838 : 11906;
  const pageHeight = landscape ? 11906 : 16838;
  const orientation = landscape ? ' w:orient="landscape"' : "";
  return `
    <w:sectPr>
      <w:pgSz w:w="${pageWidth}" w:h="${pageHeight}"${orientation}/>
      <w:pgMar w:top="1247" w:right="1021" w:bottom="1247" w:left="1814" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>`;
}

function contentWidthDxa() {
  return isLandscape() ? 14003 : 9071;
}

function noBorderXml() {
  return '<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>';
}

function zeroCellMarginsXml() {
  return '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>';
}

function singleBorderXml() {
  return '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
}

function xmlDocument(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:body>${body}</w:body>
  </w:document>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  </Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  </Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
      <w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:rPrDefault>
      <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault>
    </w:docDefaults>
  </w:styles>`;
}

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = zipHeader(0x04034b50, [
      u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0)
    ]);
    localParts.push(local, nameBytes, data);
    centralParts.push(zipHeader(0x02014b50, [
      u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)
    ]), nameBytes);
    offset += local.length + nameBytes.length + data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = zipHeader(0x06054b50, [
    u16(0), u16(0), u16(Object.keys(files).length), u16(Object.keys(files).length),
    u32(centralSize), u32(offset), u16(0)
  ]);
  return new Blob([...localParts, ...centralParts, end]);
}

function zipHeader(signature, fields) {
  return concatUint8([u32(signature), ...fields]);
}

function concatUint8(parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function u16(value) {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value, true);
  return out;
}

function u32(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value >>> 0, true);
  return out;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

init();
