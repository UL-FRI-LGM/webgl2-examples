export class SceneLoader {

    async loadScene(url) {
        const sceneUrl = new URL(url, window.location);
        const scene = await this.loadJson(sceneUrl);

        const images = scene.textures.map(url => this.loadImage(new URL(url, sceneUrl)));
        const meshes = scene.meshes.map(url => this.loadJson(new URL(url, sceneUrl)));

        scene.textures = await Promise.all(images);
        scene.meshes = await Promise.all(meshes);

        return scene;
    }

    async loadImage(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        return image;
    }

    async loadJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }

}
