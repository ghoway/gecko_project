// Kirim token saat halaman dimuat
(function() {
  // Fungsi untuk mengirim token ke extension
  function sendToken() {
    const token = localStorage.getItem("token");

    if (token) {
      console.log("Sending token to extension");
      chrome.runtime.sendMessage({
        action: "storeToken",
        data: { token }
      });
    }
  }

  // Kirim token saat halaman sudah dimuat
  sendToken();

  // Tambahkan listener untuk perubahan localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === "token") {
      sendToken();
    }
  });
})();