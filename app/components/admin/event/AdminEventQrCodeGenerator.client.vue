<template>
  <div class="flex flex-col gap-2">
    <span>Generate QR code, select size:</span>
    <div class="flex gap-2">
      <button class="px-2 py-1 bg-white rounded-md font-medium border border-merino-400" @click="generateQrCode(256)">256px</button>
      <button class="px-2 py-1 bg-white rounded-md font-medium border border-merino-400" @click="generateQrCode(512)">512px</button>
      <button class="px-2 py-1 bg-white rounded-md font-medium border border-merino-400" @click="generateQrCode(1024)">1024px</button>
    </div>
    <div ref="qr-target" class="peer" />
    <p class="peer-has-[*]:block hidden">
      Right click on the QR code to save it as an image.
    </p>
  </div>
</template>

<script lang="ts" setup>
import QrCreator from 'qr-creator';

const { eventUrl } = defineProps<{
  eventUrl: string;
}>();

const qrTarget = useTemplateRef('qr-target');


function generateQrCode(size: number = 256) {

  if (qrTarget.value === null) {
    console.error("QR target element is not available.");
    return;
  }

  qrTarget.value.innerHTML = ''; // Clear previous QR code

  QrCreator.render({
    text: eventUrl,
    radius: 0, // 0.0 to 0.5
    ecLevel: 'H', // L, M, Q, H
    fill: '#00000', // foreground color
    background: null, // color or null for transparent
    size // in pixels
  }, qrTarget.value);
}

</script>
