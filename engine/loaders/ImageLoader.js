export class ImageLoader {

    async load(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        return imageBitmap;
    }

}
