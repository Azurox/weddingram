<template>
  <div>
    <form @submit.prevent="onUploadFormSubmit">
      <fieldset :disabled="isLoading">
        <input type="file" multiple @change="handleFileInput" >
        <input type="submit" value="Upload Pictures" >
      </fieldset>
    </form>
  </div>
</template>

<script lang="ts" setup>
const { handleFileInput, files } = useFileStorage()
const {isLoading, uploadPictures} = useGlobalPictureUploader()

async function onUploadFormSubmit() {
  await uploadPictures(files.value)
}
</script>

<style>

</style>