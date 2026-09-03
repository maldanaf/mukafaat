import Script from "next/script";
import type { TrackingSettings } from "@config/siteSettings";

/**
 * وسوم التتبّع المبنية من إعدادات لوحة التحكم.
 *
 * مقسومة إلى جزأين لأن موضع الوسم يغيّر سلوكه: ما يجب أن يسبق أول رسم
 * للصفحة (GTM، البكسلات) يذهب في <head>، وما يتطلّب DOM جاهزاً أو وسم
 * <noscript> يذهب أول <body> — والمتصفّح ينقل أي <iframe> خارج <head>
 * فيختلف ما صيّره السيرفر عمّا يبنيه العميل وينهار الترطيب.
 *
 * كل قسم يُرجع null إن لم يُضبط شيء، فالإعدادات الفارغة لا تُنتج وسماً واحداً.
 */

/**
 * يبني سكربتاً يحقن HTML خاماً في `head` أو `body`.
 *
 * الحقن عبر `innerHTML` وحده لا يُنفّذ وسوم <script> بداخله (قيد في
 * المواصفة)، فنعيد إنشاء كل وسم <script> بـ createElement ونسخ سماته —
 * وبها وحدها تعمل أكواد التتبّع التي يلصقها المدير.
 *
 * ونستعمل JSON.stringify لتمرير النص: هو ما يهرّب الاقتباسات والأسطر
 * الجديدة و`</script>` تهريباً صحيحاً، فلا يكسر النصُّ السكربتَ الحاوي له.
 */
function buildInjector(html: string, target: "head" | "body"): string {
  return `(function(){try{
    var tpl=document.createElement('template');
    tpl.innerHTML=${JSON.stringify(html)};
    var frag=tpl.content;
    var scripts=frag.querySelectorAll('script');
    for(var i=0;i<scripts.length;i++){
      var old=scripts[i];
      var s=document.createElement('script');
      for(var j=0;j<old.attributes.length;j++){
        s.setAttribute(old.attributes[j].name,old.attributes[j].value);
      }
      s.text=old.textContent||'';
      old.parentNode.replaceChild(s,old);
    }
    document.${target}.appendChild(frag);
  }catch(e){}})();`;
}

/** كل ما يسبق أول رسم: GTM، GA4، والبكسلات، ثم أكواد المدير المخصّصة */
export function TrackingHead({ tracking }: { tracking: TrackingSettings }) {
  const {
    gtmId,
    googleAnalyticsId,
    facebookPixelId,
    snapchatPixelId,
    tiktokPixelId,
    customHeadScripts,
  } = tracking;

  // لا شيء مضبوط ⇒ لا نُصيّر حتى العنصر الحاوي
  if (
    !gtmId &&
    !googleAnalyticsId &&
    !facebookPixelId &&
    !snapchatPixelId &&
    !tiktokPixelId &&
    !customHeadScripts
  ) {
    return null;
  }

  return (
    <>
      {gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {googleAnalyticsId && (
        <>
          <Script
            id="ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${googleAnalyticsId}');`}
          </Script>
        </>
      )}

      {facebookPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${facebookPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {snapchatPixelId && (
        <Script id="snap-pixel" strategy="afterInteractive">
          {`(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${snapchatPixelId}');snaptr('track','PAGE_VIEW');`}
        </Script>
      )}

      {tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(e,n){e[n]=function(){e.push([n].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(e){for(var n=ttq._i[e]||[],i=0;i<ttq.methods.length;i++)ttq.setAndDefer(n,ttq.methods[i]);return n};ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement('script');o.type='text/javascript';o.async=!0;o.src=i+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokPixelId}');ttq.page()}(window,document,'ttq');`}
        </Script>
      )}

      {/*
        أكواد المدير الحرّة.

        لا نلفّها بـ <div>: المتصفّح لا يقبل <div> داخل <head> فينقله خارجه،
        فيختلف ما صيّره السيرفر عمّا يبنيه العميل وينهار الترطيب في كل الموقع
        (نفس العلّة الموثّقة عند ختم المركز السعودي). ولا نطبعها نصاً مباشراً
        لأن React يهرّب الوسوم فتظهر حرفياً على الصفحة. فنحقنها من سكربت
        يبني الوسوم ويُلحقها بـ <head>، وهو ما يجعل حتى <script> بداخلها
        ينفَّذ فعلاً — إذ لا يُنفَّذ سكربت أُدرج عبر innerHTML.
      */}
      {customHeadScripts && (
        <Script id="custom-head-scripts" strategy="afterInteractive">
          {buildInjector(customHeadScripts, "head")}
        </Script>
      )}
    </>
  );
}

/** ما يجب أن يقع أول <body>: إطار GTM البديل وأكواد المدير الحرّة */
export function TrackingBody({ tracking }: { tracking: TrackingSettings }) {
  const { gtmId, customBodyScripts } = tracking;

  if (!gtmId && !customBodyScripts) return null;

  return (
    <>
      {/* البديل لمن عطّل الجافاسكربت — GTM لا يعمل بدونه إطلاقاً */}
      {gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      )}

      {/* نفس آلية الحقن المستعملة في <head> — بها وحدها تُنفَّذ السكربتات */}
      {customBodyScripts && (
        <Script id="custom-body-scripts" strategy="afterInteractive">
          {buildInjector(customBodyScripts, "body")}
        </Script>
      )}
    </>
  );
}
