from fastapi import FastAPI, UploadFile, File
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

import io


app = FastAPI()


print("Loading OCR model...")


processor = TrOCRProcessor.from_pretrained(
    "microsoft/trocr-base-printed"
)

model = VisionEncoderDecoderModel.from_pretrained(
    "microsoft/trocr-base-printed"
)


print("OCR model loaded!")


@app.get("/")
def home():
    return {
        "message": "OCR service is running"
    }


@app.post("/ocr")
async def perform_ocr(
    file: UploadFile = File(...)
):

    image_bytes = await file.read()

    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")


    pixel_values = processor(
        images=image,
        return_tensors="pt"
    ).pixel_values


    generated_ids = model.generate(
        pixel_values
    )


    text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0]


    return {
        "text": text
    }