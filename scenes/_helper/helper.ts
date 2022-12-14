export default class Helper {
    static between(min: number, max: number) {
        return Math.floor(
            Math.random() * (max - min + 1) + min
        );
    }
    
    static getMillisecondsFromSeconds(seconds: number) {
        return seconds * 1000;
    }
}