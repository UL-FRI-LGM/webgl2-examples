export class Vertex {

    constructor({
        position,
        texcoords,
        normal,
        tangent,
    } = {}) {
        this.position = position;
        this.texcoords = texcoords;
        this.normal = normal;
        this.tangent = tangent;
    }

}
