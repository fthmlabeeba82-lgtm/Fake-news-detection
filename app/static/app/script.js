
document.addEventListener("DOMContentLoaded", function () {
    const imageUpload = document.getElementById("imageUpload");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const imageName = document.getElementById("imageName");
    const imageSize = document.getElementById("imageSize");
    const removeImage = document.getElementById("removeImage");

    const extractTextBtn = document.getElementById("extractTextBtn");
    const ocrStatus = document.getElementById("ocrStatus");
    const newsText = document.getElementById("newsText");
    const newsForm = document.getElementById("newsForm");
    const checkNews = document.getElementById("checkNews");

    // IMAGE UPLOAD + PREVIEW
    if (imageUpload) {
        imageUpload.addEventListener("change", function () {
            const file = this.files[0];

            if (!file) {
                clearImagePreview();
                return;
            }

            if (!file.type.startsWith("image/")) {
                alert("Please select an image file.");
                this.value = "";
                clearImagePreview();
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Image size must be less than 5 MB.");
                this.value = "";
                clearImagePreview();
                return;
            }

            if (imagePreview && imagePreviewContainer) {
                imagePreview.src = URL.createObjectURL(file);
                imagePreviewContainer.classList.remove("hidden");
            }

            if (imageName) imageName.textContent = file.name;
            if (imageSize) {
                imageSize.textContent =
                    (file.size / 1024).toFixed(1) + " KB";
            }

            if (extractTextBtn) {
                extractTextBtn.style.display = "inline-flex";
            }

            if (ocrStatus) {
                ocrStatus.style.display = "none";
                ocrStatus.textContent = "";
            }
        });
    }

    // CLEAR IMAGE PREVIEW
    function clearImagePreview() {
        if (imagePreview) {
            if (imagePreview.src.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview.src);
            }
            imagePreview.removeAttribute("src");
        }

        if (imagePreviewContainer) {
            imagePreviewContainer.classList.add("hidden");
        }

        if (imageName) imageName.textContent = "";
        if (imageSize) imageSize.textContent = "";

        if (extractTextBtn) {
            extractTextBtn.style.display = "none";
        }
    }

    // REMOVE IMAGE
    if (removeImage) {
        removeImage.addEventListener("click", function () {
            if (imageUpload) imageUpload.value = "";
            clearImagePreview();
        });
    }

    // OCR USING TESSERACT.JS
    async function extractTextFromImage(file) {
        if (!file || !newsText || !ocrStatus) return false;

        ocrStatus.style.display = "block";
        ocrStatus.textContent = "Reading image...";

        if (typeof Tesseract === "undefined") {
            ocrStatus.textContent =
                "OCR could not be loaded. Please check your internet connection.";
            return false;
        }

        try {
            const result = await Tesseract.recognize(file, "eng", {
                logger: function (message) {
                    if (message.status === "recognizing text") {
                        ocrStatus.textContent =
                            "Reading text... " +
                            Math.round(message.progress * 100) + "%";
                    }
                }
            });

            const extractedText = result.data.text.trim();

            if (!extractedText) {
                ocrStatus.textContent =
                    "Could not detect any text in the image.";
                return false;
            }

            newsText.value = extractedText;
            newsText.dispatchEvent(new Event("input", { bubbles: true }));

            ocrStatus.textContent =
                "Text extracted successfully! Please verify the text before prediction.";

            return true;

        } catch (error) {
            console.error("OCR error:", error);
            ocrStatus.textContent =
                "Text extraction failed. Please try another image.";
            return false;
        }
    }

    // EXTRACT TEXT BUTTON — only one click handler
    if (extractTextBtn) {
        extractTextBtn.addEventListener("click", async function () {
            const file = imageUpload?.files[0];

            if (!file) {
                if (ocrStatus) {
                    ocrStatus.style.display = "block";
                    ocrStatus.textContent =
                        "Please upload an image first.";
                }
                return;
            }

            extractTextBtn.disabled = true;

            try {
                await extractTextFromImage(file);
            } finally {
                extractTextBtn.disabled = false;
            }
        });
    }

    // AUTOMATIC OCR WHEN SUBMITTING AN IMAGE WITHOUT TEXT
    if (newsForm) {
        newsForm.addEventListener("submit", async function (event) {
            const imageFile = imageUpload?.files[0];

            if (!imageFile || newsText.value.trim()) {
                return;
            }

            event.preventDefault();

            if (checkNews) checkNews.disabled = true;

            try {
                const success = await extractTextFromImage(imageFile);

                if (success && newsText.value.trim()) {
                    newsForm.submit();
                } else {
                    alert(
                        "OCR failed. Please use the Extract Text button or type the text manually."
                    );
                }
            } finally {
                if (checkNews) checkNews.disabled = false;
            }
        });
    }

    // CLEAR BUTTON
    const clearNews = document.getElementById("clearNews");

    if (clearNews) {
        clearNews.addEventListener("click", function () {
            if (newsText) {
                newsText.value = "";
                newsText.dispatchEvent(
                    new Event("input", { bubbles: true })
                );
            }

            if (imageUpload) imageUpload.value = "";
            clearImagePreview();

            if (ocrStatus) {
                ocrStatus.textContent = "";
                ocrStatus.style.display = "none";
            }
        });
    }
});
