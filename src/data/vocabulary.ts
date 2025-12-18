export const vocabularyData = [
  {
    id: "edu-1",
    word: "ACADEMIC",
    ipa: "/ˌæk.əˈdem.ɪk/",
    type: "Adjective", // Sẽ hiển thị màu xanh
    definition: "Liên quan đến giáo dục, học thuật.",
    wordFamily: [
      { form: "Academy", type: "n" }, // Màu đỏ
      { form: "Academically", type: "adv" }
    ],
    patterns: "Academic achievement/performance",
    collocations: [
      "Academic standards (Tiêu chuẩn học thuật)",
      "An academic year (Một năm học)"
    ],
    note: "Dùng để nói về việc học tập tại trường lớp chính quy.",
    examples: [
      "The school is known for its high academic standards.",
      "She has a brilliant academic career ahead of her."
    ],
    topic: "Education",
    status: "new"
  },
  {
    id: "env-1", // Giữ lại từ cũ để test
    word: "CONTRIBUTE",
    ipa: "/kənˈtrɪb.juːt/",
    type: "Verb",
    definition: "Đóng góp, góp phần vào.",
    wordFamily: [
      { form: "Contribution", type: "n" },
      { form: "Contributor", type: "n" }
    ],
    patterns: "Contribute TO something",
    collocations: [
      "Significantly contribute to",
      "Make a contribution"
    ],
    note: "Dùng cho cả nghĩa tích cực và trung lập.",
    examples: ["Smoking contributes to health problems."],
    topic: "Environment",
    status: "learning"
  }
  // Thêm các từ khác tương tự tại đây...
];