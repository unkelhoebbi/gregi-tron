import { Injectable } from '@nestjs/common';
import axios from 'axios';
import cheerio from 'cheerio';

@Injectable()
export class TemperatureService {
    WEBSITE = 'https://hydroproweb.zh.ch/Listen/AktuelleWerte/AktWassertemp.html';
    async getCurrentTemperature(): Promise<string> {
        try {
            const response = await axios.get(this.WEBSITE);
            const html = response.data;
            const $ = cheerio.load(html);
            let extractedValue: string | null = null;

            $('table tr').each((index, element) => {
                const tds = $(element).find('td');
                const location = $(tds[0]).text().trim();

                if (location === 'Limmat-Zch. KW Letten') {
                    extractedValue = $(tds[3]).text().trim();
                    return false;
                }
            });

            return extractedValue;
        } catch (error) {
            console.error(error);
            throw new Error('Failed to get the temperature.');
        }
    }
}
