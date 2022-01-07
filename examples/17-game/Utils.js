export class Utils {

    static init(object, defaults, options) {
        const filtered = Utils.clone(options || {});
        const defaulted = Utils.clone(defaults || {});
        for (const key in filtered) {
            if (!defaulted.hasOwnProperty(key)) {
                delete filtered[key];
            }
        }
        Object.assign(object, defaulted, filtered);
    }

    static clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

}
