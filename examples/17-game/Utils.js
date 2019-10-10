export default class Utils {

    static init(object, defaults, options) {
        let filtered = Utils.clone(options || {});
        let defaulted = Utils.clone(defaults || {});
        for (let key in filtered) {
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
