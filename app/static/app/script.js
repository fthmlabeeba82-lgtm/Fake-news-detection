// =========================
// IMAGE UPLOAD
// =========================

const imageUpload = document.getElementById("imageUpload");

const imagePreviewContainer =
    document.getElementById("imagePreviewContainer");

const imagePreview =
    document.getElementById("imagePreview");

const imageName =
    document.getElementById("imageName");

const imageSize =
    document.getElementById("imageSize");

const removeImage =
    document.getElementById("removeImage");


// When user selects an image
imageUpload.addEventListener("change", function () {

    const file = this.files[0];

    // No file selected
    if (!file) {
        return;
    }


    // Check file type
    if (!file.type.startsWith("image/")) {

        alert("Please select an image file.");

        this.value = "";

        return;
    }


    // Check file size
    if (file.size > 5 * 1024 * 1024) {

        alert("Image size must be less than 5 MB.");

        this.value = "";

        return;
    }


    // Read selected image
    const reader = new FileReader();

    reader.onload = function (event) {

        // Show image preview
        imagePreview.src = event.target.result;

        // Show image name
        imageName.textContent = file.name;

        // Show image size
        imageSize.textContent =
            (file.size / 1024).toFixed(1) + " KB";

        // Make preview visible
        imagePreviewContainer.classList.remove("hidden");
    };

    reader.readAsDataURL(file);

});


// =========================
// REMOVE IMAGE
// =========================

removeImage.addEventListener("click", function () {

    // Clear selected file
    imageUpload.value = "";

    // Clear preview
    imagePreview.src = "";

    // Hide preview box
    imagePreviewContainer.classList.add("hidden");

});


// =========================
// CHECK NEWS BUTTON
// =========================

const checkNews =
    document.getElementById("checkNews");

checkNews.addEventListener("click", function () {

    const newsText =
        document.getElementById("newsText").value.trim();

    const image =
        imageUpload.files[0];


    // Check whether user entered anything
    if (newsText === "" && !image) {

        alert(
            "Please enter a news article or upload an image."
        );

        return;
    }


    // Temporary message
    // ML model will be connected later


});


function togglePassword(inputId, button) {
    const passwordInput = document.getElementById(inputId);

    if (!passwordInput) return;

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        button.textContent = "Hide";
        button.setAttribute("aria-label", "Hide password");
    } else {
        passwordInput.type = "password";
        button.textContent = "Show";
        button.setAttribute("aria-label", "Show password");
    }
}
