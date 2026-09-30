const FormData = require("form-data");
const axios = require("axios");

async function runOCR(file) {

    const form = new FormData();

    form.append(
        "file",
        file.buffer,
        {
            filename: file.originalname,
            contentType: file.mimetype
        }
    );

    const response = await axios.post(
       `${process.env.OCR_SERVICE_URL}/ocr`,
        form,
        {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }
    );

    return response.data;
}

module.exports = {
    runOCR
};