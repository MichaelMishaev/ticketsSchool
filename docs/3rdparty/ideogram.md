key: fGDoK4f_gOWFjcDaS4vLxaavoVaWtzD8EgQXJiqWP72Fz3PBSg-bRzdtup_ajnP_vBBUZXZhBnPF3Y-CLxv4MA

# Ideogram Developer API

The Ideogram API lets you integrate the Ideogram Image Generation models right into your product.

## Capabilities

### Character Reference

With **Character reference**, you can define and reuse distinctive characters, ensuring that facial features, hairstyles, and other key traits remain consistent from one image to the next. This feature is enabled on our API V3 endpoints for the generate, remix, & edit.

*prompt: A cinematic medium shot of a man sitting on a motorcycle in a dimly lit garage.*

<div style="display: flex; align-items: baseline; gap: 10px; margin: 10px 0;">
<Frame caption="character_reference_images">
<img src="file:a21fb93e-08e1-4046-bb48-57f41668f981" width="200" height="200"/>
</Frame>
<Frame caption="result">
<img src="file:86a91e71-acfe-4372-bb59-2b85ad77c1b0" width="200" height="200"/>
</Frame>
</div>

### Generate

Generate an image given a descriptive prompt.

*prompt: A photo of a cat sleeping on a couch.*

<div style="display: flex; align-items: baseline;">
<Frame caption="result">
<img src="file:a11297ea-9f9c-4881-9845-602316e891f2" width="355" height="200"/>
</Frame>
</div>

### Remix

The **Remix** tool is invaluable for making changes to an existing image, whether it was generated in Ideogram or uploaded. The AI uses the original image as a basis to generate a new one, allowing you to control how much influence the original image has on the final result.

*prompt: A photo of a dog sleeping on a couch*

<div style="display: flex; align-items: baseline; gap: 10px; margin: 10px 0;">
<Frame caption="image">
<img src="file:39f9aacb-0515-48e9-a07f-cedea72e1217" width="200" height="200"/>
</Frame>
<Frame caption="result">
<img src="file:1ba84f99-032c-41c8-b243-819c270aabed" width="200" height="200"/>
</Frame>
</div>

### Edit

Take a starting image and modify a part of an image while keeping the rest intact.

*prompt: A dog wearing a cowboy hat*

<div style="display: flex; align-items: baseline; gap: 10px; margin: 10px 0;">
<Frame caption="image">
<img src="file:583ee44b-f569-4775-8cf9-cf5052feb5a7" width="173" height="200"/>
</Frame>
<Frame caption="mask">
<img src="file:51703c0a-4042-4a39-8603-885207108192" width="173" height="200"/>
</Frame>
<Frame caption="result">
<img src="file:472c861b-d46a-49b2-8fa0-9ce7981f636b" width="173" height="200"/>
</Frame>
</div>

### Reframe

Take a starting image and extend it to match your desired resolution.

*resolution: 1280x768*

<div style="display: flex; align-items: baseline; gap: 10px; margin: 10px 0;">
<Frame caption="image">
<img src="file:86a91e71-acfe-4372-bb59-2b85ad77c1b0" width="200" height="200"/>
</Frame>
<Frame caption="result">
<img src="file:a4313e96-2375-4383-99e6-1279be4970d8" width="333" height="200"/>
</Frame>
</div>

### Replace Background

Take a starting image and replace the background with a new one.

*prompt: A man standing in a busy coffee shop*

<div style="display: flex; align-items: baseline; gap: 10px; margin: 10px 0;">
<Frame caption="image">
<img src="file:a21fb93e-08e1-4046-bb48-57f41668f981" width="200" height="200"/>
</Frame>
<Frame caption="result">
<img src="file:05cf679a-f271-43db-9b64-347640b09823" width="200" height="200"/>
</Frame>
</div>

### Face Swapping

Using the Edit endpoint, you can take a starting image and swap the face of the person in the image with a new one.

*prompt: A man sitting on a motorcycle in a dimly lit garage*

<div style="display: flex; align-items: baseline; gap: 10px;">
<Frame caption="image">
<img src="file:86a91e71-acfe-4372-bb59-2b85ad77c1b0" width="200" height="200"/>
</Frame>
<Frame caption="mask">
<img src="file:3ab1f796-de58-48ff-8ddf-f5743c2a6421" width="200" height="200"/>
</Frame>
<Frame caption="character">
<img src="file:94210061-b57a-47d2-b9bb-05df3b010e7f" width="200" height="200"/>
</Frame>
</div>
<div style="display: flex; align-items: baseline; gap: 10px;">
<Frame caption="result">
<img src="file:c21576cc-67bb-4acc-8192-8776d80ab160" width="200" height="200"/>
</Frame>
</div>

### Style Presets

Using any of the API V3 endpoints, you can use a style_preset to generate an image.
Here are a few examples with the same prompt but different `style_preset` values.

*prompt: A bioluminescent jellyfish in an underwater city*

<div style="display: flex; align-items: baseline; gap: 10px;">
<Frame caption="90S_NOSTALGIA">
<img src="file:e2c8d37e-675f-4b41-9916-9e6b1e06c24b" width="200" height="200"/>
</Frame>
<Frame caption="JAPANDI_FUSION">
<img src="file:be4792b5-792a-4b0c-8418-9bcb3e398640" width="200" height="200"/>
</Frame>
<Frame caption="MIXED_MEDIA">
<img src="file:ac7385b8-1260-4101-b316-ccb84ba549ed" width="200" height="200"/>
</Frame>
</div>

*prompt: A birthday cake with "Creative Typography" written on it*

<div style="display: flex; align-items: baseline; gap: 10px;">
<Frame caption="SPOTLIGHT_80S">
<img src="file:bb51f041-3018-413a-ad7e-7df4f84eac71" width="200" height="200"/>
</Frame>
<Frame caption="ART_BRUT">
<img src="file:b006d808-fc66-4238-8e60-3993d93ce3f8" width="200" height="200"/>
</Frame>
<Frame caption="C4D_CARTOON">
<img src="file:3baa9f94-ab6d-4fc1-9bb9-22af4c654cf1" width="200" height="200"/>
</Frame>
</div>

For more detailed documentation on our models' capabilities, please refer to our [Official Documentation](https://docs.ideogram.ai/).

## Start building

<CardGroup cols={2}>
  <Card title="Setup" href="/ideogram-api/api-setup">
    Get started by following our Setup guide and then follow this example for a simple Generation with and without character reference.
  </Card>
  <Card title="API Reference" href="/api-reference/api-reference">
    View the full API reference for all endpoints and parameters.
  </Card>
</CardGroup>

## Quickstart

Get started by following our Setup guide and then follow this example for a simple Generation with and without a character reference image.

<Tabs>
<Tab title="Python">
```python
import requests

# Generate with Ideogram 3.0 (POST /v1/ideogram-v3/generate)
response = requests.post(
  "https://api.ideogram.ai/v1/ideogram-v3/generate",
  headers={
    "Api-Key": "<apiKey>"
  },
  json={
    "prompt": "A picture of a cat",
    "rendering_speed": "TURBO"
  }
)
print(response.json())
if response.status_code == 200:
  with open('output.png', 'wb') as f:
    f.write(requests.get(response.json()['data'][0]['url']).content)

# Generate with character reference
response = requests.post(
  "https://api.ideogram.ai/v1/ideogram-v3/generate",
  headers={
    "Api-Key": "<apiKey>"
  },
  data={
    "style_type": "AUTO",
    "prompt": "A cinematic medium shot of a man sitting on a motorcycle in a dimly lit garage.",
  },
  files=[
    ("character_reference_images", open("character_reference_image.png", "rb")),
  ]
)
print(response.json())
if response.status_code == 200:
  with open('output_character.png', 'wb') as f:
    f.write(requests.get(response.json()['data'][0]['url']).content)
```
</Tab>
<Tab title="Typescript">
```typescript
const formData = new FormData();
formData.append('prompt', 'A photo of a cat');
formData.append('rendering_speed', 'TURBO');
formData.append('style_type', 'AUTO');

// To add character reference images, uncomment the following lines
// formData.append('character_reference_images', '<character_reference_image>');
const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
  method: 'POST',
  headers: { 'Api-Key': '<apiKey>' },
  body: formData
});
const data = await response.json();
console.log(data);
```
</Tab>
</Tabs>

## Enterprise Scale

The Ideogram API serves thousands of API customers to generate millions of images daily. If you wish to utilize our API at a larger scale than our default rate limit of 10 inflight requests, please reach out to us at *partnership@ideogram.ai* and we will help fit your exact needs.
Ideogram’s API offers powerful capabilities for developers and businesses looking to integrate Ideogram into their applications. Below are the basics to get started with Ideogram’s API.

<Error>
**IMPORTANT**: Image links created by the Ideogram API expire. If you want to keep the image, you must download it and store it.
</Error>

## Signup

To set up or access the Ideogram API, you first need to log in to your [Ideogram user account](https://ideogram.ai/). If you don’t have an account, you can easily create one by following [these steps](https://docs.ideogram.ai/using-ideogram/getting-started/signup-and-registration).

<Warning> 
**Note:** Ideogram user subscriptions and API accounts are separate, each with its own payment system. Please note that you must log in to your Ideogram user account (which can be a free account) to set up or access your API account.
</Warning>

Once logged in, navigate to the "API Beta" option, which you can find under the Settings menu (represented by the "burger" icon) at the top right corner of the page on a desktop or at the bottom right on a mobile device.

<picture><img src="file:7f14cea3-93b1-46df-8795-caa149c9ed5a" class="dark" width="293" height="567" alt=""/><img src="file:d7a4bca3-dcf7-4e82-9a69-1d8d9180a982" class="light" alt="" width="293" height="567" /></picture>

You will need then need to accept the [Developer API Agreement and Policy](https://ideogram.ai/legal/api-tos) to proceed.

<figure><picture><img src="file:6ba38a63-7635-40a3-8753-af924173f2c2" class="dark" alt="" width="563" height="150"/><img src="file:3bdfe869-35ac-47b5-87e4-cb7635ae3dad" class="light" alt="" width="563" height="150"/></picture><figcaption><p>You need to accept the Developer API Agreement and Policy before continuing with the signup process.</p></figcaption></figure>

After accepting the agreement, you will be directed to the API dashboard. Select the "Manage Payment" button in the lower left corner to add your payment information, which will be linked and used to fund your API credit balance.

<figure><picture><img src="file:1b7fbb5b-d262-4958-ae84-4c864a215039" class="dark" alt=""/><img src="file:38a75be6-6a96-4f9f-995b-8f29ca3121c5" class="light" alt=""/></picture><figcaption></figcaption></figure>

Next, choose whether you are using the API for personal or business purposes.

<figure><picture><img src="file:1aa7e106-2ebd-4f00-bf7c-5b25e0a98e99" class="dark" alt="" width="563" height="130"/><img src="file:268e9aa1-e895-4cfe-881b-dfb47f453a31" class="light" alt="" width="563" height="130"/></picture><figcaption></figcaption></figure>

You will then be forwarded to the payment page, where you will need to provide all necessary payment information. You will only be charged when you create your first API key.

<figure><img src="file:9cb1ccab-7a92-4b2e-a03b-72ddc2051232" alt=""/><figcaption><p>Provide all payment information here. You will only be charged when you create your first API key.</p></figcaption></figure>

## Generating an API key

<Error>
**IMPORTANT**:\
• The full API key <mark style="color:red;">**will only be shown to you once**</mark>, at the time of its creation. You need to store it in a safe place immediately, as it will not be displayed again afterward.

• Generating the API key may take some time. Please <mark style="color:red;">**do not refresh or close the window**</mark> until the process is complete.
</Error>

At this point, you will be ready to create your first API key, which will trigger an initial funding that will be added to your balance. As you use the API, funds will be deducted from your credit balance based on our [API pricing](https://ideogram.ai/features/api-pricing). Your balance will automatically top-up to a predetermined value when it drops below a certain threshold. In the example image below, the Top-up Balance is \$40.00 and the Minimum Balance Threshold is \$10.00.

<figure><picture><img src="file:5bd139ac-f2cb-4f18-b87d-3168e859b7e4" class="dark" alt=""/><img src="file:316fef2b-2ccf-4c8e-958d-153d529a7bca" class="light" alt=""/></picture><figcaption></figcaption></figure>

You can now click the "Create API key" button to generate your first API key, which will allow you to integrate Ideogram into your applications. You may create multiple API keys, and all  keys you generate will be billed under the same plan.

Once created, the keys will appear as partial keys, displaying only the first few characters as a security measure. They will appear as shown in the image below.

<figure><picture><img src="file:be2d8e1d-34ce-4a66-a811-c55666f511d9" class="dark" alt=""/><img src="file:410107b3-79bf-4f4e-911d-43bf66593434" class="light" alt=""/></picture><figcaption><p>This is how generated API keys appear in the Manage API </p></figcaption></figure>

You can click "Manage payment", located near the bottom of the API management window, at any time to update your linked payment information or billing details.

## Adjusting the Top-Up Balance and Threshold

You can adjust the minimum balance that triggers an automatic top-up. Additionally, you can set the account balance level that you want your automatic top-up to bring you to. By default, the minimum balance threshold is \$10 and the top-up balance is \$40. To adjust these values, click the Edit button and enter your desired amounts in the respective fields. Then, click Save to confirm your changes.

<figure><picture><img src="file:8dd68f4d-672b-4a15-971d-02e006e72bbc" class="dark" width="563" height="86" alt=""/><img src="file:cef0a619-ba4e-4c63-877c-e12e048ef45e" class="light" alt="" width="563" height="86"/></picture><figcaption><p>Click on the Edit button to change the values.</p></figcaption></figure>

<figure><picture><img src="file:eb13ae30-9828-4dc9-a89c-f321dec2675e" class="dark" width="563" height="74" alt=""/><img src="file:1734a73b-ed9b-42fe-a777-dad89941a289" class="light" alt="" width="563" height="74"/></picture><figcaption><p>Click on the Save button to save your changes.</p></figcaption></figure>

After that modification, every time the balance dips to \$5.00 or below, it will automatically top-up to the predetermined amount of \$80.00.

<Info>
Note: The minimum balance threshold must be above \$2.00 and the top up balance must be above \$10.00.
</Info>

## Useful links

* API Docs: [https://developer.ideogram.ai](https://developer.ideogram.ai/api-reference)
* API Agreement and Policy (TOS): [https://ideogram.ai/legal/api-tos](https://ideogram.ai/legal/api-tos)
* API Pricing: [https://ideogram.ai/features/api-pricing](https://ideogram.ai/features/api-pricing)
# Generate with Ideogram 3.0

POST https://api.ideogram.ai/v1/ideogram-v3/generate
Content-Type: multipart/form-data

Generates images synchronously based on a given prompt and optional parameters using the Ideogram 3.0 model.

Images links are available for a limited period of time; if you would like to keep the image, you must download it.

Reference: https://developer.ideogram.ai/api-reference/api-reference/generate-v3

## OpenAPI Specification

```yaml
openapi: 3.1.1
info:
  title: Generate with Ideogram 3.0
  version: endpoint_generate.post_generate_image_v3
paths:
  /v1/ideogram-v3/generate:
    post:
      operationId: post-generate-image-v-3
      summary: Generate with Ideogram 3.0
      description: >-
        Generates images synchronously based on a given prompt and optional
        parameters using the Ideogram 3.0 model.


        Images links are available for a limited period of time; if you would
        like to keep the image, you must download it.
      tags:
        - - subpackage_generate
      parameters:
        - name: Api-Key
          in: header
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Image(s) generated successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/type_:ImageGenerationResponseV3'
        '400':
          description: Invalid input provided.
          content: {}
        '401':
          description: Not authorized to generate an image.
          content: {}
        '422':
          description: Prompt failed the safety check.
          content: {}
        '429':
          description: Too many requests.
          content: {}
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                prompt:
                  type: string
                seed:
                  type: integer
                resolution:
                  $ref: '#/components/schemas/type_:ResolutionV3'
                aspect_ratio:
                  $ref: '#/components/schemas/type_:AspectRatioV3'
                rendering_speed:
                  $ref: '#/components/schemas/type_:RenderingSpeed'
                magic_prompt:
                  $ref: '#/components/schemas/type_:MagicPromptOption'
                negative_prompt:
                  type: string
                num_images:
                  type: integer
                color_palette:
                  $ref: >-
                    #/components/schemas/type_:ColorPaletteWithPresetNameOrMembers
                style_codes:
                  type: array
                  items:
                    $ref: '#/components/schemas/type_:StyleCode'
                style_type:
                  $ref: '#/components/schemas/type_:StyleTypeV3'
                style_preset:
                  $ref: '#/components/schemas/type_:StylePresetV3'
components:
  schemas:
    type_:ResolutionV3:
      type: string
      enum:
        - value: 512x1536
        - value: 576x1408
        - value: 576x1472
        - value: 576x1536
        - value: 640x1344
        - value: 640x1408
        - value: 640x1472
        - value: 640x1536
        - value: 704x1152
        - value: 704x1216
        - value: 704x1280
        - value: 704x1344
        - value: 704x1408
        - value: 704x1472
        - value: 736x1312
        - value: 768x1088
        - value: 768x1216
        - value: 768x1280
        - value: 768x1344
        - value: 800x1280
        - value: 832x960
        - value: 832x1024
        - value: 832x1088
        - value: 832x1152
        - value: 832x1216
        - value: 832x1248
        - value: 864x1152
        - value: 896x960
        - value: 896x1024
        - value: 896x1088
        - value: 896x1120
        - value: 896x1152
        - value: 960x832
        - value: 960x896
        - value: 960x1024
        - value: 960x1088
        - value: 1024x832
        - value: 1024x896
        - value: 1024x960
        - value: 1024x1024
        - value: 1088x768
        - value: 1088x832
        - value: 1088x896
        - value: 1088x960
        - value: 1120x896
        - value: 1152x704
        - value: 1152x832
        - value: 1152x864
        - value: 1152x896
        - value: 1216x704
        - value: 1216x768
        - value: 1216x832
        - value: 1248x832
        - value: 1280x704
        - value: 1280x768
        - value: 1280x800
        - value: 1312x736
        - value: 1344x640
        - value: 1344x704
        - value: 1344x768
        - value: 1408x576
        - value: 1408x640
        - value: 1408x704
        - value: 1472x576
        - value: 1472x640
        - value: 1472x704
        - value: 1536x512
        - value: 1536x576
        - value: 1536x640
    type_:AspectRatioV3:
      type: string
      enum:
        - value: 1x3
        - value: 3x1
        - value: 1x2
        - value: 2x1
        - value: 9x16
        - value: 16x9
        - value: 10x16
        - value: 16x10
        - value: 2x3
        - value: 3x2
        - value: 3x4
        - value: 4x3
        - value: 4x5
        - value: 5x4
        - value: 1x1
    type_:RenderingSpeed:
      type: string
      enum:
        - value: FLASH
        - value: TURBO
        - value: DEFAULT
        - value: QUALITY
    type_:MagicPromptOption:
      type: string
      enum:
        - value: AUTO
        - value: 'ON'
        - value: 'OFF'
    type_:ColorPalettePresetName:
      type: string
      enum:
        - value: EMBER
        - value: FRESH
        - value: JUNGLE
        - value: MAGIC
        - value: MELON
        - value: MOSAIC
        - value: PASTEL
        - value: ULTRAMARINE
    type_:ColorPaletteWithPresetName:
      type: object
      properties:
        name:
          $ref: '#/components/schemas/type_:ColorPalettePresetName'
      required:
        - name
    type_:ColorPaletteMember:
      type: object
      properties:
        color_hex:
          type: string
        color_weight:
          type: number
          format: double
      required:
        - color_hex
    type_:ColorPaletteWithMembers:
      type: object
      properties:
        members:
          type: array
          items:
            $ref: '#/components/schemas/type_:ColorPaletteMember'
      required:
        - members
    type_:ColorPaletteWithPresetNameOrMembers:
      oneOf:
        - $ref: '#/components/schemas/type_:ColorPaletteWithPresetName'
        - $ref: '#/components/schemas/type_:ColorPaletteWithMembers'
    type_:StyleCode:
      type: string
    type_:StyleTypeV3:
      type: string
      enum:
        - value: AUTO
        - value: GENERAL
        - value: REALISTIC
        - value: DESIGN
        - value: FICTION
    type_:StylePresetV3:
      type: string
      enum:
        - value: 80S_ILLUSTRATION
        - value: 90S_NOSTALGIA
        - value: ABSTRACT_ORGANIC
        - value: ANALOG_NOSTALGIA
        - value: ART_BRUT
        - value: ART_DECO
        - value: ART_POSTER
        - value: AURA
        - value: AVANT_GARDE
        - value: BAUHAUS
        - value: BLUEPRINT
        - value: BLURRY_MOTION
        - value: BRIGHT_ART
        - value: C4D_CARTOON
        - value: CHILDRENS_BOOK
        - value: COLLAGE
        - value: COLORING_BOOK_I
        - value: COLORING_BOOK_II
        - value: CUBISM
        - value: DARK_AURA
        - value: DOODLE
        - value: DOUBLE_EXPOSURE
        - value: DRAMATIC_CINEMA
        - value: EDITORIAL
        - value: EMOTIONAL_MINIMAL
        - value: ETHEREAL_PARTY
        - value: EXPIRED_FILM
        - value: FLAT_ART
        - value: FLAT_VECTOR
        - value: FOREST_REVERIE
        - value: GEO_MINIMALIST
        - value: GLASS_PRISM
        - value: GOLDEN_HOUR
        - value: GRAFFITI_I
        - value: GRAFFITI_II
        - value: HALFTONE_PRINT
        - value: HIGH_CONTRAST
        - value: HIPPIE_ERA
        - value: ICONIC
        - value: JAPANDI_FUSION
        - value: JAZZY
        - value: LONG_EXPOSURE
        - value: MAGAZINE_EDITORIAL
        - value: MINIMAL_ILLUSTRATION
        - value: MIXED_MEDIA
        - value: MONOCHROME
        - value: NIGHTLIFE
        - value: OIL_PAINTING
        - value: OLD_CARTOONS
        - value: PAINT_GESTURE
        - value: POP_ART
        - value: RETRO_ETCHING
        - value: RIVIERA_POP
        - value: SPOTLIGHT_80S
        - value: STYLIZED_RED
        - value: SURREAL_COLLAGE
        - value: TRAVEL_POSTER
        - value: VINTAGE_GEO
        - value: VINTAGE_POSTER
        - value: WATERCOLOR
        - value: WEIRD
        - value: WOODBLOCK_PRINT
    type_:ImageGenerationObjectV3:
      type: object
      properties:
        url:
          type: string
          format: uri
        prompt:
          type: string
        resolution:
          $ref: '#/components/schemas/type_:ResolutionV3'
        is_image_safe:
          type: boolean
        seed:
          type: integer
        style_type:
          $ref: '#/components/schemas/type_:StyleTypeV3'
      required:
        - prompt
        - resolution
        - is_image_safe
        - seed
    type_:ImageGenerationResponseV3:
      type: object
      properties:
        created:
          type: string
          format: date-time
        data:
          type: array
          items:
            $ref: '#/components/schemas/type_:ImageGenerationObjectV3'
      required:
        - created
        - data

```

## SDK Code Examples

```python
import requests

# Generate with Ideogram 3.0 (POST /v1/ideogram-v3/generate)
response = requests.post(
  "https://api.ideogram.ai/v1/ideogram-v3/generate",
  headers={
    "Api-Key": "<apiKey>"
  },
  json={
    "prompt": "A picture of a cat",
    "rendering_speed": "TURBO"
  }
)
print(response.json())
with open('output.png', 'wb') as f:
  f.write(requests.get(response.json()['data'][0]['url']).content)

# Generate with style reference images
response = requests.post(
  "https://api.ideogram.ai/v1/ideogram-v3/generate",
  headers={
    "Api-Key": "<apiKey>"
  },
  data={
    "prompt": "A picture of a cat",
    "aspect_ratio": "3x1"
  },
  files=[
    ("style_reference_images", open("style_reference_image_1.png", "rb")),
    ("style_reference_images", open("style_reference_image_2.png", "rb")),
  ]
)
print(response.json())
with open('output.png', 'wb') as f:
  f.write(requests.get(response.json()['data'][0]['url']).content)

```

```typescript
const formData = new FormData();
formData.append('prompt', 'A photo of a cat');
formData.append('rendering_speed', 'TURBO');
// To add style reference images, uncomment the following lines
// formData.append('style_reference_images', '<style_reference_image_1>');
// formData.append('style_reference_images', '<style_reference_image_2>');
const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
  method: 'POST',
  headers: { 'Api-Key': '<apiKey>' },
  body: formData
});
const data = await response.json();
console.log(data);

```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://api.ideogram.ai/v1/ideogram-v3/generate"

	payload := strings.NewReader("-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"prompt\"\r\n\r\nA photo of a cat sleeping on a couch.\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"seed\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"resolution\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"aspect_ratio\"\r\n\r\n1x1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"rendering_speed\"\r\n\r\nTURBO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"magic_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"negative_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"num_images\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"color_palette\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_codes\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_type\"\r\n\r\nAUTO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_preset\"\r\n\r\n\r\n-----011000010111000001101001--\r\n")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Api-Key", "<apiKey>")
	req.Header.Add("Content-Type", "multipart/form-data; boundary=---011000010111000001101001")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.ideogram.ai/v1/ideogram-v3/generate")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Api-Key"] = '<apiKey>'
request["Content-Type"] = 'multipart/form-data; boundary=---011000010111000001101001'
request.body = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"prompt\"\r\n\r\nA photo of a cat sleeping on a couch.\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"seed\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"resolution\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"aspect_ratio\"\r\n\r\n1x1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"rendering_speed\"\r\n\r\nTURBO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"magic_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"negative_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"num_images\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"color_palette\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_codes\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_type\"\r\n\r\nAUTO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_preset\"\r\n\r\n\r\n-----011000010111000001101001--\r\n"

response = http.request(request)
puts response.read_body
```

```java
HttpResponse<String> response = Unirest.post("https://api.ideogram.ai/v1/ideogram-v3/generate")
  .header("Api-Key", "<apiKey>")
  .header("Content-Type", "multipart/form-data; boundary=---011000010111000001101001")
  .body("-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"prompt\"\r\n\r\nA photo of a cat sleeping on a couch.\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"seed\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"resolution\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"aspect_ratio\"\r\n\r\n1x1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"rendering_speed\"\r\n\r\nTURBO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"magic_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"negative_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"num_images\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"color_palette\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_codes\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_type\"\r\n\r\nAUTO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_preset\"\r\n\r\n\r\n-----011000010111000001101001--\r\n")
  .asString();
```

```php
<?php

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.ideogram.ai/v1/ideogram-v3/generate', [
  'multipart' => [
    [
        'name' => 'prompt',
        'contents' => 'A photo of a cat sleeping on a couch.'
    ],
    [
        'name' => 'aspect_ratio',
        'contents' => '1x1'
    ],
    [
        'name' => 'rendering_speed',
        'contents' => 'TURBO'
    ],
    [
        'name' => 'style_type',
        'contents' => 'AUTO'
    ]
  ]
  'headers' => [
    'Api-Key' => '<apiKey>',
  ],
]);

echo $response->getBody();
```

```csharp
var client = new RestClient("https://api.ideogram.ai/v1/ideogram-v3/generate");
var request = new RestRequest(Method.POST);
request.AddHeader("Api-Key", "<apiKey>");
request.AddParameter("multipart/form-data; boundary=---011000010111000001101001", "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"prompt\"\r\n\r\nA photo of a cat sleeping on a couch.\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"seed\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"resolution\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"aspect_ratio\"\r\n\r\n1x1\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"rendering_speed\"\r\n\r\nTURBO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"magic_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"negative_prompt\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"num_images\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"color_palette\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_codes\"\r\n\r\n\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_type\"\r\n\r\nAUTO\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"style_preset\"\r\n\r\n\r\n-----011000010111000001101001--\r\n", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Api-Key": "<apiKey>",
  "Content-Type": "multipart/form-data; boundary=---011000010111000001101001"
]
let parameters = [
  [
    "name": "prompt",
    "value": "A photo of a cat sleeping on a couch."
  ],
  [
    "name": "seed",
    "value": 
  ],
  [
    "name": "resolution",
    "value": 
  ],
  [
    "name": "aspect_ratio",
    "value": "1x1"
  ],
  [
    "name": "rendering_speed",
    "value": "TURBO"
  ],
  [
    "name": "magic_prompt",
    "value": 
  ],
  [
    "name": "negative_prompt",
    "value": 
  ],
  [
    "name": "num_images",
    "value": 
  ],
  [
    "name": "color_palette",
    "value": 
  ],
  [
    "name": "style_codes",
    "value": 
  ],
  [
    "name": "style_type",
    "value": "AUTO"
  ],
  [
    "name": "style_preset",
    "value": 
  ]
]

let boundary = "---011000010111000001101001"

var body = ""
var error: NSError? = nil
for param in parameters {
  let paramName = param["name"]!
  body += "--\(boundary)\r\n"
  body += "Content-Disposition:form-data; name=\"\(paramName)\""
  if let filename = param["fileName"] {
    let contentType = param["content-type"]!
    let fileContent = String(contentsOfFile: filename, encoding: String.Encoding.utf8)
    if (error != nil) {
      print(error as Any)
    }
    body += "; filename=\"\(filename)\"\r\n"
    body += "Content-Type: \(contentType)\r\n\r\n"
    body += fileContent
  } else if let paramValue = param["value"] {
    body += "\r\n\r\n\(paramValue)"
  }
}

let request = NSMutableURLRequest(url: NSURL(string: "https://api.ideogram.ai/v1/ideogram-v3/generate")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
request.allHTTPHeaderFields = headers
request.httpBody = postData as Data

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```