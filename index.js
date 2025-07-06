const axios = require('axios');
const express = require('express');
const app = express();
const PORT = 3000;

const API_KEY = 'FreeinRAxQH83KiDdrCiadVZ5PbvJcmo';

const TelegramBot = require('node-telegram-bot-api');

// توکن بات تلگرام
const TOKEN = '7621113599:AAH6JS1Kpb0_5upgGyd72dYwsEsDJNdjT6g';


const API_URL = `https://BrsApi.ir/Api/Market/Gold_Currency.php?key=${API_KEY}`;

// ساخت بات با polling
const bot = new TelegramBot(TOKEN, { polling: true });
const getPrice = async () => {
    const response = await axios.get(API_URL);
    const data = response.data;
    return data
}
const getsymbol = async () => {
    const response = await axios.get(`https://BrsApi.ir/Api/Tsetmc/AllSymbols.php?key=${API_KEY}&type=1`);
    const data = response.data;
    return data


}

// bot.onText(/\/start/, async (msg) => {
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, 'در حال دریافت قیمت‌ها...');

//     try {
//         // const response = await axios.get(API_URL);
//         // const data = response.data;

//         let symbol = await getsymbol()

//         let data = await getPrice()
//         // console.log(data)
//         // فرض می‌کنیم این کلیدها هستن (باید دقیق بررسی بشه)
//         // const gold18 = data.gold || 'یافت نشد';
//         // const goldFund = data.goldFund || 'یافت نشد';

//         // const message = `💰 قیمت طلای ۱۸ عیار: ${gold18}\n🏦 قیمت صندوق طلای عیار: ${goldFund}`;
//         const message = `💰 قیمت طلای ۱۸ عیار: ${symbol[0].l18}\n🏦 قیمت صندوق طلای عیار: ${symbol[0].l18}`;

//         bot.sendMessage(chatId, message);
//         // bot.sendMessage(chatId, data);
//     } catch (error) {
//         bot.sendMessage(chatId, '❌ خطا در دریافت قیمت‌ها. لطفا دوباره تلاش کنید.');
//         console.error(error.message);
//     }
// });
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const welcomeText = `سلام 👋
به ربات مالی خوش آمدید! لطفاً یکی از گزینه‌های زیر را انتخاب کنید:`;

    const options = {
        reply_markup: {
            keyboard: [
                ['💰 قیمت طلا'],
                ['📈 نمادهای بورسی'],
                ['₿ قیمت کریپتو'],
                ['تحلیل']
            ],
            resize_keyboard: true, // اندازه‌ی کیبورد رو تنظیم می‌کنه
            one_time_keyboard: false // می‌تونه همیشه نمایش داده بشه
        }
    };

    bot.sendMessage(chatId, welcomeText, options);
});
const userStates = {}; // وضعیت فعلی هر کاربر

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
console.log(text)
    if (text === '💰 قیمت طلا') {
        // کد گرفتن قیمت طلا
        const data = await getPrice(); // فرض بر اینه این تابع آماده‌ست
        const gold = data.gold.map(item => `🔸 ${item.name}: ${item.price.toLocaleString()} ${item.unit}`).join('\n');
        const crypto = data.cryptocurrency.map(c =>
            `💠 ${c.name} (${c.symbol}): ${c.price} ${c.unit} | تغییر: ${c.change_percent}%`
        ).join('\n\n');
            const currency = data.currency.map(item => `🔸 ${item.name}: ${item.price.toLocaleString()} ${item.unit}`).join('\n');

        const fullMsg = `🟡 قیمت طلا:\n${gold}\n\n \n\n💰 ارزها:\n${currency}`;
        bot.sendMessage(chatId, fullMsg);
        // bot.sendMessage(chatId, `🪙 قیمت طلا: ${data.goldPrice} تومان`);

    } else   // بررسی وضعیت کاربر
        if (userStates[chatId] === 'awaiting_symbol_name') {
            const symbolName = text.trim();
            try {
                const symbols = await getsymbol();
                const match = symbols.find(s =>
                    s.l30.includes(symbolName) || s.l18.includes(symbolName)
                );

                if (match) {
                    // const symbolData = // دیتای کامل که فرستادی (item)
                    const analysis1 = advancedAnalysis(match);
                    // bot.sendMessage(chatId, text);
                    const response = `
                📈 نماد: ${match.l30} (${match.l18})
                قیمت پایانی: ${match.pc} تومان
                🔻 کمترین: ${match.pmin}
                🔺 بیشترین: ${match.pmax}
                🔄 حجم معاملات: ${parseInt(match.tvol).toLocaleString()}
                💰 ارزش بازار: ${parseInt(match.mv).toLocaleString()} تومان
                📊 P/E: ${match.pe}
        `;
                    bot.sendMessage(chatId, analysis1);
                    // bot.sendMessage(chatId, response, analysis1);
                } else {
                    bot.sendMessage(chatId, `❌ نماد "${symbolName}" پیدا نشد. دوباره امتحان کنید.`);
                }
            } catch (err) {
                bot.sendMessage(chatId, '❌ خطا در دریافت اطلاعات نماد');
            }

            userStates[chatId] = null; // بازنشانی وضعیت
            return;
        }

    // حالت اولیه دکمه‌ها
    if (text === '📈 نمادهای بورسی') {
        userStates[chatId] = 'awaiting_symbol_name';
        bot.sendMessage(chatId, 'لطفاً نام نماد بورسی را وارد کنید (مثلاً: فملی یا فولاد)');
    } else if (text === '₿ قیمت کریپتو') {
        // به عنوان مثال قیمت بیت‌کوین
        const data = await getPrice(); // فرض بر اینه این تابع آماده‌ست
        const gold = data.gold.map(item => `🔸 ${item.name}: ${item.price.toLocaleString()} ${item.unit}`).join('\n');
        const crypto = data.cryptocurrency.map(c =>
            `💠 ${c.name} (${c.symbol}): ${c.price} ${c.unit} | تغییر: ${c.change_percent}%`
        ).join('\n\n');
        const fullMsg = `\n\n💰 رمزارزها:\n${crypto}`;
        bot.sendMessage(chatId, fullMsg);
    } else if (text === 'تحلیل') {
        const symbols = await getsymbol();
        const buySignals = filterBuySignals(symbols);
        // console.log(buySignals)
        if (buySignals.length === 0) {
            await bot.sendMessage(chatId, 'سیگنال خرید پیدا نشد');
        } else {
            for (const s of buySignals) {
                const msg = `نماد: ${s.symbol} (${s.name})\n${s.signal}\n-----------------`;
                // اگر پیام خیلی طولانی بود می‌تونیم اونو خودمون هم کوتاه کنیم یا پیام رو خرد کنیم
                if (msg.length > 4000) {
                    // اینجا می‌تونی برش بدی یا فقط بخشی از متن رو ارسال کنی
                    await bot.sendMessage(chatId, msg.slice(0, 4000));
                } else {
                    await bot.sendMessage(chatId, msg);
                }
            }
        }

    }
});

// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;

//     bot.sendMessage(chatId, 'یکی از دسته‌بندی‌ها رو انتخاب کن:', {
//         reply_markup: {
//             inline_keyboard: [
//                 [{ text: '🟡 طلا', callback_data: 'gold' }],
//                 [{ text: '💰 رمزارز', callback_data: 'crypto' }],
//                 [{ text: '📈 بورس', callback_data: 'symbol' }]
//             ]
//         }
//     });
// });
// --- هندل کلیک روی دکمه ---
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const dataType = callbackQuery.data;

    if (dataType === 'gold') {
        try {
            const data = await getPrice();
            const gold = data.gold.map(item => `🔸 ${item.name}: ${item.price.toLocaleString()} ${item.unit}`).join('\n');
            const crypto = data.cryptocurrency.map(c =>
                `💠 ${c.name} (${c.symbol}): ${c.price} ${c.unit} | تغییر: ${c.change_percent}%`
            ).join('\n\n');
            const fullMsg = `🟡 قیمت طلا:\n${gold}\n\n💰 رمزارزها:\n${crypto}`;
            bot.sendMessage(chatId, fullMsg);
        } catch (err) {
            bot.sendMessage(chatId, '❌ خطا در دریافت قیمت‌ها');
        }
    }

    if (dataType === 'symbol') {
        try {
            const symbols = await getsymbol();
            const item = symbols[0]; // فقط اولین نماد
            const text = `
                📈 نماد: ${item.l30} (${item.l18})
                قیمت پایانی: ${item.pc} تومان
                🔻 کمترین: ${item.pmin}
                🔺 بیشترین: ${item.pmax}
                🔄 حجم معاملات: ${parseInt(item.tvol).toLocaleString()}
                💰 ارزش بازار: ${parseInt(item.mv).toLocaleString()} تومان
                📊 P/E: ${item.pe}
      `;
            bot.sendMessage(chatId, text);
        } catch (err) {
            bot.sendMessage(chatId, '❌ خطا در دریافت اطلاعات نماد');
        }
    }

    bot.answerCallbackQuery(callbackQuery.id);
});

function advancedAnalysis(item) {
    const toToman = (num) => Number(num).toLocaleString("fa-IR");
    const percent = (num) => `${parseFloat(num).toFixed(2)}٪`;

    const priceChangePercent = item.plp;
    const lastPrice = item.pl;
    const closingPrice = item.pc;
    const max = item.pmax;
    const min = item.pmin;
    const pe = item.pe;
    const eps = item.eps;
    const tvol = item.tvol;
    const tval = item.tval;
    const mv = item.mv;

    const buyI = item.Buy_I_Volume;
    const sellI = item.Sell_I_Volume;
    const buyN = item.Buy_N_Volume;
    const sellN = item.Sell_N_Volume;
    const countI = item.Buy_CountI;
    const countSellI = item.Sell_CountI || 1; // پیشگیری از تقسیم بر صفر

    let analysis = `📊 تحلیل کامل نماد ${item.l30} (${item.l18})\n\n`;

    // 🔺 تغییرات قیمت
    analysis += `🔺 قیمت پایانی: ${toToman(closingPrice)} تومان (${percent(item.pcp)})\n`;
    analysis += `📌 آخرین معامله: ${toToman(lastPrice)} تومان (${percent(priceChangePercent)})\n`;

    if (lastPrice === max) {
        analysis += `🟢 در سقف قیمتی روز بسته شده است. احتمال صف خرید یا حمایت قوی.\n`;
    } else if (lastPrice === min) {
        analysis += `🔴 در کف قیمتی روز بسته شده. نشانه فشار فروش.\n`;
    }

    // 📈 P/E و سود
    analysis += `\n💡 EPS: ${eps}\n📊 P/E: ${pe}\n`;
    if (pe < 5) analysis += `📉 P/E پایین‌تر از حد نرمال؛ ممکنه ارزنده باشه یا بازار بی‌اعتماد.\n`;
    else if (pe > 20) analysis += `⚠️ P/E بالا؛ یا انتظار رشد یا حباب احتمالی.\n`;

    // 💰 حجم معاملات
    analysis += `\n🔄 حجم معاملات: ${toToman(tvol)} سهم\n💸 ارزش معاملات: ${toToman(tval)} تومان\n`;

    if (tvol > 100_000_000)
        analysis += `✅ حجم معاملات بالا، نشانه توجه بازار.\n`;

    // 🧍‍♂️👨‍💼 رفتار حقیقی/حقوقی
    const totalBuy = buyI + buyN;
    const totalSell = sellI + sellN;
    const buyPower = buyI / countI || 0;
    const sellPower = sellI / countSellI || 0;

    analysis += `\n👨‍💼 حقوقی خرید: ${toToman(buyN)}\n🧍‍♂️ حقیقی خرید: ${toToman(buyI)}\n`;
    analysis += `👨‍💼 حقوقی فروش: ${toToman(sellN)}\n🧍‍♂️ حقیقی فروش: ${toToman(sellI)}\n`;

    if (buyI > sellI)
        analysis += `🟢 قدرت خرید حقیقی بیشتر از فروش؛ احتمالاً ورود پول حقیقی.\n`;
    else
        analysis += `🔻 فروش حقیقی بالا؛ ممکنه خروج پول یا اصلاح قیمت باشه.\n`;

    if (buyPower > sellPower)
        analysis += `✅ قدرت خریدار بیشتر از فروشنده (${toToman(buyPower)} در مقابل ${toToman(sellPower)})\n`;
    else
        analysis += `⚠️ قدرت فروشنده بیشتر؛ احتیاط در ورود.\n`;

    // 💰 ارزش بازار
    analysis += `\n🏦 ارزش بازار: ${toToman(mv)} تومان\n`;
    if (mv < 10_000_000_000_000)
        analysis += `💡 شرکت در دسته با ارزش بازار کوچک یا متوسط است (نوسان‌پذیری بالا).\n`;
    else
        analysis += `🏢 شرکت با ارزش بازار بزرگ است. نوسان‌پذیری کمتر.\n`;

    // 📦 صف‌ها (تابلو سفارشات)
    if (item.qd1 > 0 && item.pd1 === max)
        analysis += `\n📥 صف خرید در سقف قیمت با ${toToman(item.qd1)} سهم\n`;
    if (item.qo1 > 0 && item.po1 === min)
        analysis += `📤 صف فروش در کف قیمت با ${toToman(item.qo1)} سهم\n`;

    // تحلیل کوتاه‌مدت
    if (priceChangePercent > 2 && tvol > 50_000_000)
        analysis += `\n📈 تحلیل کوتاه‌مدت: سیگنال خرید قوی به دلیل افزایش قیمت و حجم معاملات بالا.\n`;
    else if (priceChangePercent > 0)
        analysis += `\n📈 تحلیل کوتاه‌مدت: روند مثبت با افزایش قیمت جزئی.\n`;
    else if (priceChangePercent < -2)
        analysis += `\n📉 تحلیل کوتاه‌مدت: هشدار فروش به دلیل کاهش قیمت و فشار فروش.\n`;
    else
        analysis += `\n⚖️ تحلیل کوتاه‌مدت: وضعیت متعادل؛ نیاز به تأیید بیشتر.\n`;

    // تحلیل بلندمدت
    if (pe < 10 && eps > 0 && mv > 5_000_000_000_000)
        analysis += `\n📊 تحلیل بلندمدت: شرکت بنیادی خوب با پتانسیل رشد بلندمدت.\n`;
    else if (pe > 20)
        analysis += `\n⚠️ تحلیل بلندمدت: ریسک بالا یا حباب احتمالی، با دقت بیشتری بررسی شود.\n`;
    else
        analysis += `\n⚠️ تحلیل بلندمدت: نیاز به بررسی بیشتر وضعیت بنیادی و گزارش‌های فصلی.\n`;

    // سیگنال نهایی خرید یا فروش
    let finalSignal = '';
    if (priceChangePercent > 2 && buyI > sellI && pe < 15 && eps > 0 && tvol > 50_000_000) {
        finalSignal = '🚀 سیگنال خرید قوی';
    } else if (priceChangePercent > 0 && buyI >= sellI && pe < 20) {
        finalSignal = '✅ سیگنال خرید متوسط';
    } else if (priceChangePercent < -2 || buyI < sellI) {
        finalSignal = '⚠️ هشدار فروش یا اصلاح قیمت';
    } else {
        finalSignal = '⚖️ بدون سیگنال مشخص، احتیاط کنید';
    }

    analysis += `\n\n${finalSignal}`;

    return analysis;
}

// تابع کمکی استخراج سیگنال از متن تحلیل
function extractSignal(analysisText) {
    const lines = analysisText.split('\n').reverse(); // از انتها بررسی می‌کنیم
    for (let line of lines) {
        if (line.includes('سیگنال')) {
            return line.trim();
        }
    }
    return 'سیگنال نامشخص';
}

// تابع اصلی برای فیلتر سیگنال خرید
function filterBuySignals(items) {
    let result = [];

    for (let item of items) {
        const analysis = advancedAnalysis(item);
        const signal = extractSignal(analysis);

        if (signal.includes('سیگنال خرید')) {
            result.push({
                symbol: item.l18,
                name: item.l30,
                signal,
                analysis
            });
        }
    }

    return result;
}



app.get('/api/prices', async (req, res) => {
    try {
        let data = await getPrice(); // فرض می‌کنیم این تابع قیمت‌ها رو برمی‌گردونه
        // console.log(data);
        let symbol = await getsymbol()

        // if (!data.gold18 || !data.ayarFund) {
        //     return res.status(404).json({ error: "اطلاعات پیدا نشد" });
        // }

        res.json({
            gold: data,
            cryptocurrency: data.cryptocurrency,
            symbol: symbol
            // data
            // gold18: data.gold18,
            // ayarFund: data.ayarFund
        });
    } catch (err) {
        console.error("خطا در دریافت قیمت:", err);
        res.status(500).json({ error: "خطای داخلی سرور" });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
