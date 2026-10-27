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


const extractTextBtn = document.getElementById("extractTextBtn");
const ocrStatus = document.getElementById("ocrStatus");
const newsText = document.getElementById("newsText");

if (extractTextBtn && ocrStatus && imageUpload && newsText) {
    extractTextBtn.addEventListener("click", async function () {
        const file = imageUpload.files[0];

        if (!file) {
            ocrStatus.style.display = "block";
            ocrStatus.textContent = "Please upload an image first.";
            return;
        }

        const formData = new FormData();
        formData.append("news_image", file);

        extractTextBtn.disabled = true;
        ocrStatus.style.display = "block";
        ocrStatus.textContent = "Reading image...";

        try {
            const response = await fetch("/extract-image-text/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": document.querySelector(
                        "[name=csrfmiddlewaretoken]"
                    ).value
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to extract text.");
            }

            newsText.value = data.text;
            ocrStatus.textContent =
                "Text extracted successfully! Please verify the text before prediction.";

        } catch (error) {
            ocrStatus.textContent = error.message;
        } finally {
            extractTextBtn.disabled = false;
        }
    });
}

async function extractTextFromImage(file) {
    const status = document.getElementById("ocrStatus");
    const newsText = document.getElementById("newsText");

    if (!file || !status || !newsText) {
        return;
    }

    status.style.display = "block";
    status.textContent = "Extracting text from the image...";

    try {
        const result = await Tesseract.recognize(file, "eng", {
            logger: (message) => {
                if (message.status === "recognizing text") {
                    status.textContent =
                        `Reading text...: ${Math.round(message.progress * 100)}%`;
                }
            }
        });

        const extractedText = result.data.text.trim();

        if (!extractedText) {
            status.textContent = "Could not detect any text in the image.";
            return;
        }

        newsText.value = extractedText;
        status.textContent =
            "Text extracted successfully! Please verify the text before prediction.";

    } catch (error) {
        status.textContent =
            "OCR could not be loaded. Please check your internet connection.";
        console.error(error);
    }
}

const ocrImageUpload = document.getElementById("imageUpload");
const checkNewsButton = document.getElementById("checkNews");
const newsForm = document.querySelector("form");

if (ocrImageUpload && extractTextBtn) {
    ocrImageUpload.addEventListener("change", function () {
        extractTextBtn.style.display =
            ocrImageUpload.files.length > 0 ? "block" : "none";
    });

    extractTextBtn.addEventListener("click", async function () {
        const file = ocrImageUpload.files[0];

        if (file) {
            await extractTextFromImage(file);
        }
    });
}

if (newsForm) {
    newsForm.addEventListener("submit", async function (event) {
        const imageFile = ocrImageUpload?.files[0];
        const newsText = document.getElementById("newsText");

        if (!imageFile || newsText.value.trim()) {
            return;
        }

        event.preventDefault();

        const checkButton = document.getElementById("checkNews");
        checkButton.disabled = true;

        try {
            await extractTextFromImage(imageFile);

            if (newsText.value.trim()) {
                newsForm.submit();
            } else {
                alert(
                    "Failed to extract text from the image." +
                    "Please use the Extract Text button or type the text manually."
                );
            }
        } catch (error) {
            console.error("Automatic OCR error:", error);
            alert("OCR failed. Please try using the Extract Text button.");
        } finally {
            checkButton.disabled = false;
        }
    });
}