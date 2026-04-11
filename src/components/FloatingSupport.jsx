import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../state/AppContext";

const supportMessages = {
  en: {
    title: "Product assistant",
    status: "Online now",
    welcome:
      "Ask me about any product, category, or store and I will suggest matching items for you.",
    inputPlaceholder: "Ask about laptops, decor, kitchen, accessories...",
    send: "Send",
    browse: "Browse store",
    noResults:
      "I could not find a close match yet. Try a product name, category, or store name.",
    suggestionPrefix: "Here are some suggestions you may like:",
    quickPrompts: [
      "Show me electronics",
      "Suggest decor products",
      "What can I find in Home Store?",
    ],
    quickOne: "Create a seller account",
    quickTwo: "Browse approved stores",
    quickThree: "Talk on WhatsApp",
  },
  ar: {
    title: "مساعد المنتجات",
    status: "متصل الآن",
    welcome:
      "اسألني عن أي منتج أو تصنيف أو متجر، وسأقترح عليك منتجات مناسبة من المتاجر الموجودة.",
    inputPlaceholder: "اسأل عن لابتوب، ديكور، مطبخ، اكسسوارات...",
    send: "إرسال",
    browse: "عرض المتجر",
    noResults:
      "لم أجد نتيجة قريبة الآن. جرّب اسم منتج أو تصنيف أو اسم متجر.",
    suggestionPrefix: "هذه بعض الاقتراحات المناسبة لك:",
    quickPrompts: [
      "اعرض لي منتجات إلكترونيات",
      "اقترح علي ديكور",
      "ماذا يوجد في Home Store؟",
    ],
    quickOne: "إنشاء حساب تاجر",
    quickTwo: "تصفح المتاجر المعتمدة",
    quickThree: "التواصل عبر واتساب",
  },
};

function normalizePhoneForWhatsapp(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || "970599123456";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function scoreProductMatch(query, product, store) {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);

  if (!tokens.length) {
    return 0;
  }

  const haystack = normalizeText(
    `${product.name} ${product.category} ${product.description} ${store?.name || ""} ${store?.category || ""} ${store?.city || ""}`,
  );

  let score = 0;

  tokens.forEach((token) => {
    if (haystack.includes(token)) {
      score += token.length > 3 ? 3 : 2;
    }

    if (normalizeText(product.name).includes(token)) {
      score += 3;
    }

    if (normalizeText(product.category).includes(token)) {
      score += 2;
    }

    if (normalizeText(store?.name).includes(token)) {
      score += 2;
    }
  });

  return score;
}

function buildAssistantReply(query, products, approvedStores, language, publicStore, getEffectiveProductPrice) {
  const scopedStores = publicStore ? [publicStore] : approvedStores;
  const scopedProducts = products.filter((product) =>
    scopedStores.some((store) => store.id === product.storeId),
  );

  const matches = scopedProducts
    .map((product) => {
      const store = scopedStores.find((item) => item.id === product.storeId);
      return {
        product,
        store,
        score: scoreProductMatch(query, product, store),
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.product.sales - left.product.sales)
    .slice(0, 3);

  if (!matches.length) {
    return {
      text: supportMessages[language].noResults,
      suggestions: [],
    };
  }

  return {
    text: supportMessages[language].suggestionPrefix,
    suggestions: matches.map(({ product, store }) => ({
      id: product.id,
      name: product.name,
      price: getEffectiveProductPrice(product),
      currency: store?.currency || "USD",
      storeName: store?.name || "",
      storeSlug: store?.slug || store?.id || "",
      category: product.category,
      image: product.image,
      productId: product.id,
    })),
  };
}

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function FloatingSupport() {
  const { pathname } = useLocation();
  const { currentUser, language, stores, products, getEffectiveProductPrice } = useApp();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const copy = supportMessages[language];

  const approvedStores = useMemo(
    () => stores.filter((store) => store.status === "approved"),
    [stores],
  );

  const publicStore = useMemo(
    () => approvedStores.find((store) => pathname === `/store/${store.slug || store.id}`) || null,
    [pathname, approvedStores],
  );

  const shouldShow =
    currentUser?.role !== "admin" &&
    currentUser?.role !== "seller" &&
    (pathname === "/" ||
      pathname === "/login" ||
      pathname === "/seller-request" ||
      pathname.startsWith("/store/"));

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: copy.welcome,
        suggestions: [],
      },
    ]);
  }, [language, publicStore?.id]);

  if (!shouldShow) {
    return null;
  }

  const whatsappPhone = normalizePhoneForWhatsapp(
    publicStore?.contactPhone || "970599123456",
  );

  const askAssistant = (value) => {
    const trimmedQuery = value.trim();

    if (!trimmedQuery) {
      return;
    }

    const reply = buildAssistantReply(
      trimmedQuery,
      products,
      approvedStores,
      language,
      publicStore,
      getEffectiveProductPrice,
    );

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmedQuery,
        suggestions: [],
      },
      {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        text: reply.text,
        suggestions: reply.suggestions,
      },
    ]);
    setQuery("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    askAssistant(query);
  };

  return (
    <div className="floating-support">
      {isChatOpen ? (
        <div className="chatbot-card">
          <div className="chatbot-card-top">
            <div>
              <strong>{copy.title}</strong>
              <span>{copy.status}</span>
            </div>
            <button
              type="button"
              className="chatbot-close"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close chatbot"
            >
              x
            </button>
          </div>

          <div className="chatbot-thread">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user" ? "chatbot-bubble user" : "chatbot-bubble assistant"
                }
              >
                <p>{message.text}</p>

                {message.suggestions?.length ? (
                  <div className="chatbot-suggestion-list">
                    {message.suggestions.map((suggestion) => (
                      <a
                        key={suggestion.id}
                        className="chatbot-suggestion-card"
                        href={`/store/${suggestion.storeSlug}/product/${suggestion.productId}`}
                      >
                        {suggestion.image ? (
                          <img
                            src={suggestion.image}
                            alt={suggestion.name}
                            className="chatbot-suggestion-image"
                          />
                        ) : (
                          <div className="chatbot-suggestion-image placeholder">
                            {suggestion.category}
                          </div>
                        )}
                        <div className="chatbot-suggestion-copy">
                          <strong>{suggestion.name}</strong>
                          <span>{suggestion.storeName}</span>
                          <small>{formatCurrency(suggestion.price, suggestion.currency)}</small>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="chatbot-quick-actions">
            {copy.quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chatbot-chip"
                onClick={() => askAssistant(prompt)}
              >
                {prompt}
              </button>
            ))}
            <a className="chatbot-chip" href="/seller-request">
              {copy.quickOne}
            </a>
            <a className="chatbot-chip" href="/">
              {copy.quickTwo}
            </a>
            <a
              className="chatbot-chip"
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
            >
              {copy.quickThree}
            </a>
          </div>

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.inputPlaceholder}
            />
            <button type="submit" className="primary-button chatbot-send-button">
              {copy.send}
            </button>
          </form>
        </div>
      ) : null}

      <div className="floating-support-stack">
        <button
          type="button"
          className="floating-chat-button"
          onClick={() => setIsChatOpen((current) => !current)}
          aria-label="Open chatbot"
        >
          <span>AI</span>
        </button>

        <a
          className="floating-whatsapp-button"
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Open WhatsApp"
        >
          <svg
            viewBox="0 0 32 32"
            className="floating-whatsapp-icon"
            aria-hidden="true"
          >
            <path
              d="M16 4.8c-6.15 0-11.2 4.93-11.2 11.06 0 2.18.64 4.2 1.74 5.91L5.2 27.2l5.6-1.27a11.25 11.25 0 0 0 5.2 1.27c6.13 0 11.2-4.94 11.2-11.07S22.13 4.8 16 4.8Zm0 20.37c-1.69 0-3.24-.47-4.59-1.3l-.32-.2-3.32.75.78-3.2-.22-.33a8.96 8.96 0 0 1-1.43-4.76c0-4.95 4.1-8.98 9.1-8.98s9.09 4.03 9.09 8.98c0 4.96-4.08 9.04-9.09 9.04Zm5.04-6.78c-.28-.14-1.67-.82-1.93-.91-.26-.1-.45-.14-.64.14-.18.27-.73.9-.89 1.08-.16.18-.32.21-.6.07-.27-.14-1.14-.42-2.17-1.34-.8-.72-1.35-1.6-1.5-1.87-.16-.27-.02-.42.12-.56.13-.13.28-.33.42-.5.14-.16.18-.28.28-.47.1-.18.05-.35-.02-.49-.07-.14-.64-1.54-.87-2.1-.23-.55-.47-.48-.64-.49h-.55c-.18 0-.49.07-.75.35-.26.28-.98.96-.98 2.35 0 1.39 1.01 2.73 1.15 2.92.14.18 1.98 3.14 4.89 4.27.69.3 1.23.48 1.65.61.69.22 1.31.19 1.81.12.55-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.06-.11-.25-.18-.53-.32Z"
              fill="currentColor"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
