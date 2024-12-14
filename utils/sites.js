import fs from 'node:fs';
import path from 'node:path';

export default class Sites {
    constructor(sitesPath, defaultLocale) {
        this.sitesPath = sitesPath;
        this.defaultLocale = defaultLocale;
    }

    // Returns a path to a site file
    sitePath(siteName, locale = this.defaultLocale) {
        return this.#getLocalisedPath(siteName, locale) || this.#getLocalisedPath('e_404', this.defaultLocale);
    }

    // Returns a path to a localised file
    #getLocalisedPath(siteName, locale) {
        const filePath = path.join(this.sitesPath, siteName, `${locale}.html`);
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : null;
    }

    // Returns the appropriate locale
    findLocale(siteName, locales) {
        if (typeof locales === 'string') {
            return this.#getLocalisedPath(siteName, locales) ? locales : this.defaultLocale;
        }

        for (const locale of locales || []) {
            if (this.#getLocalisedPath(siteName, locale)) return locale;
        }

        return this.defaultLocale;
    }
}