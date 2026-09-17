import os
import re
import json
import base64
from mimetypes import guess_type

from typing import TypedDict
from langchain_core.output_parsers import JsonOutputParser

class ClassificationDecision(TypedDict):
    """Output structure for the decision agent."""
    image_type: str
    reasoning: str
    confidence: float

class ImageClassifier:
    """Uses GPT-4o Vision to analyze images and determine their type."""
    
    def __init__(self, vision_model):
        self.vision_model = vision_model
        self.json_parser = JsonOutputParser(pydantic_object=ClassificationDecision)
        
    def local_image_to_data_url(self, image_path: str) -> str:
        """
        Get the url of a local image
        """
        mime_type, _ = guess_type(image_path)

        if mime_type is None:
            mime_type = "application/octet-stream"

        with open(image_path, "rb") as image_file:
            base64_encoded_data = base64.b64encode(image_file.read()).decode("utf-8")

        return f"data:{mime_type};base64,{base64_encoded_data}"
    
    def classify_image(self, image_path: str) -> dict:
        """Analyzes the image to classify it as a medical image and determine it's type."""
        print(f"[ImageAnalyzer] Analyzing image: {image_path}")

        vision_prompt = [
            {"role": "system", "content": "You are an expert in medical imaging. Analyze the uploaded image."},
            {"role": "user", "content": [
                {"type": "text", "text": (
                    """
                    Determine if this is a medical image. If it is, classify it as:
                    'BRAIN MRI SCAN', 'CHEST X-RAY', 'SKIN LESION', or 'OTHER'. If it's not a medical image, return 'NON-MEDICAL'.
                    You must provide your answer in JSON format with the following structure:
                    {{
                    "image_type": "IMAGE TYPE",
                    "reasoning": "Your step-by-step reasoning for selecting this agent",
                    "confidence": 0.95  // Value between 0.0 and 1.0 indicating your confidence in this classification task
                    }}
                    """
                )},
                {"type": "image_url", "image_url": {"url": self.local_image_to_data_url(image_path)}}  # Correct format
            ]}
        ]
        
        # Invoke LLM to classify the image
        response = self.vision_model.invoke(vision_prompt)

        # ponytail: vision model wraps output in <think>...</think> blocks.
        # Strip them before JSON parsing so JsonOutputParser doesn't choke.
        raw = re.sub(r"<think>.*?</think>", "", response.content,
                     flags=re.DOTALL | re.IGNORECASE).strip()
        try:
            # Ensure the response is parsed as JSON
            response_json = self.json_parser.parse(raw)
            return response_json  # Returns a dictionary instead of a string
        except Exception:
            # ponytail: catch BOTH json.JSONDecodeError and LangChain's
            # OutputParserException (the JsonOutputParser actually raises the
            # latter). Falling back to "NON-MEDICAL" with zero confidence is
            # safer than 500ing the chat endpoint.
            print("[ImageAnalyzer] Warning: Response was not valid JSON.")
            return {"image_type": "NON-MEDICAL", "reasoning": "Invalid JSON response",
                    "confidence": 0.0}

        # return response.content.strip().lower()
