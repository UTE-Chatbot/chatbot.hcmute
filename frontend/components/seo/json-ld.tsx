import { siteConfig } from "@/lib/config";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Trường Đại học Sư phạm Kỹ thuật Thành phố Hồ Chí Minh",
    alternateName: ["HCMUTE", "UTE", "Đại học Sư phạm Kỹ thuật"],
    url: "https://hcmute.edu.vn",
    logo: siteConfig.ogImage,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "1 Võ Văn Ngân, Phường Thủ Đức",
      addressLocality: "Thành phố Hồ Chí Minh",
      addressCountry: "VN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+84-28-38968641",
      contactType: "tư vấn tuyển sinh",
      availableLanguage: ["Vietnamese", "English"],
    },
    sameAs: [
      "https://www.facebook.com/ute.sao/",
      "https://hcmute.edu.vn",
      "https://tuyensinh.hcmute.edu.vn",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}chat?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh",
      url: "https://hcmute.edu.vn",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FAQJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
