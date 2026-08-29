"use client";

import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { CardTile, type CardTileData } from "@ui";
import SectionHead from "./SectionHead";
import Reveal from "./Reveal";

/**
 * بطاقات الشحن الرقمية في الرئيسية — قسم جاهز يتحكم الأدمن
 * في ترتيبه وعنوانه وإظهاره من «بناء واجهة الموقع».
 */
const CardsBand: React.FC<{
  cards: CardTileData[];
  title?: string;
  showViewAll?: boolean;
}> = ({ cards, title, showViewAll = true }) => {
  if (!cards?.length) return null;

  return (
    <section className={`${CONTAINER} pt-12 sm:pt-14`}>
      <SectionHead
        eyebrow={t("homeBuilder.cards.eyebrow", "شحن فوري")}
        title={title || t("homeBuilder.cards.title", "بطاقات شحن منوّعة")}
        subtitle={t("home.cards_new.subtitle", "بطاقات ألعاب وترفيه وتسوق يصلك كودها فوراً بعد الشراء.")}
        linkLabel={showViewAll ? t("homeBuilder.cards.allLink", "عرض جميع البطاقات") : undefined}
        linkTo={showViewAll ? "/cards" : undefined}
        className="!mb-6"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.slice(0, 8).map((card, i) => (
          <Reveal key={card.id} delay={(i % 4) * 60} className="h-full">
            <CardTile card={card} />
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default CardsBand;
