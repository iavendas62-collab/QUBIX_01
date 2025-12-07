"""
Sample Stable Diffusion Script
This is a test file for the JobUploader component
"""

import torch
from diffusers import StableDiffusionPipeline

def generate_images():
    # Load Stable Diffusion model
    model_id = "runwayml/stable-diffusion-v1-5"
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16
    )
    pipe = pipe.to("cuda")
    
    # Generate images
    prompts = [
        "A beautiful sunset over mountains",
        "A futuristic city with flying cars",
        "A serene lake with reflections"
    ]
    
    for i, prompt in enumerate(prompts):
        print(f"Generating image {i+1}/{len(prompts)}: {prompt}")
        image = pipe(prompt).images[0]
        image.save(f"output_{i+1}.png")
    
    print("Image generation complete!")

if __name__ == '__main__':
    generate_images()
