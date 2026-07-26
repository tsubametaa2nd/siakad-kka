// Fitur: interaksi checkpoint materi di client
document.addEventListener("DOMContentLoaded", function () {
  const checkpoints = document.querySelectorAll(".checkpoint-card");
  checkpoints.forEach(function (card) {
    const correctAnswer = parseInt(card.getAttribute("data-answer"), 10);
    const options = card.querySelectorAll(".checkpoint-option");
    const feedback = card.querySelector(".checkpoint-feedback");

    options.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        options.forEach(function (opt) {
          opt.classList.remove("selected", "correct", "incorrect");
        });
        btn.classList.add("selected");

        if (index === correctAnswer) {
          btn.classList.add("correct");
          feedback.textContent = "✅ Jawaban Benar! Bagus sekali.";
          feedback.className = "checkpoint-feedback feedback-correct";
        } else {
          btn.classList.add("incorrect");
          feedback.textContent = "❌ Jawaban Belum Tepat. Coba lagi!";
          feedback.className = "checkpoint-feedback feedback-incorrect";
        }
      });
    });
  });
});
