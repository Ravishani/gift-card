"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "globaltech_cart";
const COUPON_STORAGE_KEY = "globaltech_cart_coupon";
const CART_TOKEN_KEY = "customer_cart_token";
const CUSTOMER_TOKEN_KEY = "customer_token";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  AED: "د.إ",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "﷼",
};

function numberValue(value, fallback = 0) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  const number = Number(
    String(value).replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getProductId(item) {
  return (
    item?.product_id ||
    item?.productId ||
    item?.product?.id ||
    item?.product?._id ||
    item?.id ||
    item?.sku ||
    item?.slug ||
    null
  );
}

function getProductName(item) {
  return (
    item?.name ||
    item?.title ||
    item?.product_name ||
    item?.productName ||
    item?.product?.name ||
    item?.product?.title ||
    "Gift Card"
  );
}

function getCurrency(item) {
  return String(
    item?.currency?.code ||
      item?.currency_code ||
      item?.currencyCode ||
      item?.product?.currency?.code ||
      (typeof item?.currency === "string"
        ? item.currency
        : "") ||
      "INR"
  ).toUpperCase();
}

function getItemAmount(item) {
  const values = [
    item?.amount,
    item?.selectedAmount,
    item?.selected_amount,
    item?.gift_card_amount,
    item?.giftCardAmount,
    item?.price,
    item?.value,
  ];

  for (const value of values) {
    const amount = numberValue(value, 0);

    if (amount > 0) {
      return amount;
    }
  }

  return 0;
}

function getItemQuantity(item) {
  return Math.max(
    1,
    Math.floor(
      numberValue(item?.quantity, 1)
    )
  );
}

function getItemSubtotal(item) {
  const amount = getItemAmount(item);
  const quantity = getItemQuantity(item);

  return Number(
    (amount * quantity).toFixed(2)
  );
}

function getCartId(item) {
  return String(
    item?._id ||
      item?.id ||
      ""
  );
}

function getCartKey(item) {
  const productId = getProductId(item);
  const currency = getCurrency(item);
  const amount = getItemAmount(item);

  return String(
    item?.cart_key ||
      item?.cartKey ||
      `${productId}-${currency}-${Number(
        amount.toFixed(2)
      )}`
  );
}

function getBaseCartKey(item) {
  const productId = getProductId(item);
  const currency = getCurrency(item);
  const amount = getItemAmount(item);

  return `${productId}-${currency}-${Number(
    amount.toFixed(2)
  )}`;
}

function getCouponCode(coupon) {
  return String(
    coupon?.code ||
      coupon?.coupon_code ||
      coupon?.couponCode ||
      ""
  )
    .trim()
    .toUpperCase();
}

function getCouponName(coupon) {
  return String(
    coupon?.name ||
      coupon?.title ||
      coupon?.coupon_name ||
      getCouponCode(coupon) ||
      "Coupon"
  ).trim();
}

function getCouponPaymentMethod(coupon) {
  return String(
    coupon?.payment_method ||
      coupon?.paymentMethod ||
      coupon?.payment_type ||
      coupon?.paymentType ||
      "all"
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getCouponDiscountType(coupon) {
  return String(
    coupon?.discount_type ||
      coupon?.discountType ||
      coupon?.type ||
      "fixed"
  )
    .trim()
    .toLowerCase();
}

function getCouponDiscountValue(coupon) {
  return numberValue(
    coupon?.discount ??
      coupon?.discount_value ??
      coupon?.discountValue ??
      coupon?.value ??
      coupon?.amount ??
      0,
    0
  );
}

function isFirstUserCoupon(coupon) {
  return (
    String(
      coupon?.first_user_only ??
        coupon?.firstUserOnly ??
        "0"
    ) === "1" ||
    coupon?.first_user_only === true ||
    coupon?.firstUserOnly === true
  );
}

function getCouponPaymentLabel(coupon) {
  const method =
    getCouponPaymentMethod(coupon);

  if (method === "upi") {
    return "UPI";
  }

  if (
    method === "debit_card" ||
    method === "credit_card" ||
    method === "card" ||
    method.includes("card")
  ) {
    return "Card";
  }

  if (method === "wallet") {
    return "Wallet";
  }

  if (
    method === "all" ||
    method === "any"
  ) {
    return "All Payments";
  }

  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function isCouponPaymentMethodAllowed(
  coupon,
  paymentMethod
) {
  if (!coupon) {
    return false;
  }

  const couponMethod =
    getCouponPaymentMethod(coupon);

  const selectedMethod = String(
    paymentMethod || "card"
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    couponMethod === "all" ||
    couponMethod === "any" ||
    couponMethod === ""
  ) {
    return true;
  }

  if (selectedMethod === "upi") {
    return couponMethod === "upi";
  }

  if (selectedMethod === "card") {
    return (
      couponMethod === "card" ||
      couponMethod === "debit_card" ||
      couponMethod === "credit_card" ||
      couponMethod === "debit" ||
      couponMethod === "credit"
    );
  }

  if (selectedMethod === "wallet") {
    return (
      couponMethod === "wallet" ||
      couponMethod === "online_payment"
    );
  }

  return couponMethod === selectedMethod;
}

function getAssignedCoupons(item) {
  const assignments =
    item?.assign_coupons ||
    item?.assignCoupons ||
    item?.product?.assign_coupons ||
    item?.product?.assignCoupons ||
    [];

  if (!Array.isArray(assignments)) {
    return [];
  }

  return assignments
    .map((assignment) => {
      if (assignment?.coupon) {
        return assignment.coupon;
      }

      return assignment;
    })
    .filter(Boolean);
}

function findCouponOnProduct(
  item,
  couponCode
) {
  const code = String(
    couponCode || ""
  )
    .trim()
    .toUpperCase();

  if (!code) {
    return null;
  }

  return (
    getAssignedCoupons(item).find(
      (itemCoupon) =>
        getCouponCode(itemCoupon) === code
    ) || null
  );
}

function isCouponAssignedToProduct(
  item,
  coupon
) {
  const code =
    getCouponCode(coupon);

  if (!code) {
    return false;
  }

  return Boolean(
    findCouponOnProduct(
      item,
      code
    )
  );
}

function calculateCouponDiscount(
  itemSubtotal,
  coupon
) {
  if (
    !coupon ||
    itemSubtotal <= 0
  ) {
    return 0;
  }

  const value =
    getCouponDiscountValue(coupon);

  if (value <= 0) {
    return 0;
  }

  const type =
    getCouponDiscountType(coupon);

  let discount = 0;

  if (
    type === "percentage" ||
    type === "percent" ||
    type === "percentage_discount"
  ) {
    discount =
      (itemSubtotal * value) / 100;
  } else {
    discount = value;
  }

  const maxDiscount = numberValue(
    coupon?.max_discount ??
      coupon?.max_discount_amount ??
      coupon?.maximum_discount ??
      0,
    0
  );

  if (maxDiscount > 0) {
    discount = Math.min(
      discount,
      maxDiscount
    );
  }

  return Number(
    Math.min(
      itemSubtotal,
      Math.max(0, discount)
    ).toFixed(2)
  );
}

function getCouponCurrency(coupon) {
  return String(
    coupon?.currency?.code ||
      coupon?.currency_code ||
      coupon?.currencyCode ||
      ""
  ).toUpperCase();
}

function couponCurrencyMatches(
  item,
  coupon
) {
  const couponCurrency =
    getCouponCurrency(coupon);

  if (!couponCurrency) {
    return true;
  }

  return (
    couponCurrency ===
    getCurrency(item)
  );
}

function formatCurrency(
  amount,
  currency = "INR"
) {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(
      Number(amount || 0)
    );
  } catch {
    return `${
      CURRENCY_SYMBOLS[currency] ||
      currency
    }${Number(
      amount || 0
    ).toFixed(2)}`;
  }
}

function couponPriority(
  coupon,
  paymentMethod
) {
  const method =
    getCouponPaymentMethod(coupon);

  const selected = String(
    paymentMethod || ""
  )
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (method === selected) {
    return 100;
  }

  if (
    selected === "card" &&
    (
      method === "card" ||
      method === "debit_card" ||
      method === "credit_card"
    )
  ) {
    return 100;
  }

  if (
    method === "all" ||
    method === "any"
  ) {
    return 50;
  }

  return 0;
}

function getBestAutomaticCoupon(
  cartItems,
  paymentMethod
) {
  const candidates = [];

  cartItems.forEach((item) => {
    const assignedCoupons =
      getAssignedCoupons(item);

    assignedCoupons.forEach(
      (itemCoupon) => {
        if (
          !isCouponPaymentMethodAllowed(
            itemCoupon,
            paymentMethod
          )
        ) {
          return;
        }

        if (
          !couponCurrencyMatches(
            item,
            itemCoupon
          )
        ) {
          return;
        }

        const code =
          getCouponCode(itemCoupon);

        if (!code) {
          return;
        }

        const discount =
          calculateCouponDiscount(
            getItemSubtotal(item),
            itemCoupon
          );

        if (discount <= 0) {
          return;
        }

        const priority =
          couponPriority(
            itemCoupon,
            paymentMethod
          );

        const existing =
          candidates.find(
            (candidate) =>
              getCouponCode(
                candidate.coupon
              ) === code
          );

        if (existing) {
          existing.totalDiscount +=
            discount;

          existing.priority =
            Math.max(
              existing.priority,
              priority
            );
        } else {
          candidates.push({
            coupon: itemCoupon,
            totalDiscount: discount,
            priority,
          });
        }
      }
    );
  });

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => {
    if (
      b.priority !==
      a.priority
    ) {
      return (
        b.priority -
        a.priority
      );
    }

    return (
      b.totalDiscount -
      a.totalDiscount
    );
  });

  return (
    candidates[0]?.coupon ||
    null
  );
}

function getGuestCartToken() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  let token =
    localStorage.getItem(
      CART_TOKEN_KEY
    );

  if (!token) {
    token =
      typeof crypto !==
        "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}`;

    localStorage.setItem(
      CART_TOKEN_KEY,
      token
    );
  }

  return token;
}

function buildApiUrl(endpoint) {
  const baseUrl = String(API_URL)
    .trim()
    .replace(/\/+$/, "");

  let cleanEndpoint = String(
    endpoint || ""
  )
    .trim()
    .replace(/^\/+/, "");

  cleanEndpoint =
    cleanEndpoint.replace(
      /^api\/+/i,
      ""
    );

  return `${baseUrl}/${cleanEndpoint}`;
}

async function cartApi(
  endpoint,
  options = {}
) {
  if (
    typeof window ===
    "undefined"
  ) {
    throw new Error(
      "Cart API can only run in the browser"
    );
  }

  const customerToken =
    localStorage.getItem(
      CUSTOMER_TOKEN_KEY
    );

  const cartToken =
    getGuestCartToken();

  const headers = {
    Accept:
      "application/json",
    "Content-Type":
      "application/json",
    "X-Cart-Token":
      cartToken || "",
    ...(options.headers || {}),
  };

  if (customerToken) {
    headers.Authorization =
      `Bearer ${customerToken}`;
  }

  const url =
    buildApiUrl(endpoint);

  console.log(
    "CART API REQUEST:",
    options.method || "GET",
    url
  );

  let response;

  try {
    response =
      await fetch(
        url,
        {
          ...options,
          headers,
        }
      );
  } catch (error) {
    console.error(
      "CART API NETWORK ERROR:",
      {
        url,
        error,
      }
    );

    throw new Error(
      `Unable to connect to cart API: ${url}`
    );
  }

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    console.error(
      "CART API RESPONSE ERROR:",
      {
        url,
        status: response.status,
        data,
      }
    );

    throw new Error(
      data?.message ||
        `Cart request failed: ${response.status}`
    );
  }

  if (data?.cart_token) {
    localStorage.setItem(
      CART_TOKEN_KEY,
      data.cart_token
    );
  }

  return data;
}

function normalizeCartItem(
  item,
  localItem = null
) {
  const merged = {
    ...(localItem || {}),
    ...(item || {}),
  };

  const productId =
    getProductId(merged);

  const amount =
    getItemAmount(merged);

  const quantity =
    getItemQuantity(merged);

  const currency =
    getCurrency(merged);

  const normalizedAmount =
    Number(amount.toFixed(2));

  const serverId =
    item?._id ||
    item?.id ||
    localItem?._id ||
    localItem?.id ||
    null;

  return {
    ...merged,

    id:
      serverId ||
      productId,

    _id:
      item?._id ||
      localItem?._id ||
      null,

    product_id:
      item?.product_id ||
      localItem?.product_id ||
      productId,

    product:
      item?.product ||
      localItem?.product ||
      null,

    name:
      merged?.name ||
      merged?.title ||
      merged?.product_name ||
      merged?.productName ||
      merged?.product?.name ||
      "Gift Card",

    title:
      merged?.title ||
      merged?.name ||
      merged?.product?.title ||
      "Gift Card",

    image:
      merged?.image ||
      merged?.image_url ||
      merged?.product_image ||
      merged?.product?.image ||
      merged?.product?.image_url ||
      null,

    quantity,

    amount:
      normalizedAmount,

    selectedAmount:
      normalizedAmount,

    selected_amount:
      normalizedAmount,

    selectedPrice:
      normalizedAmount,

    currency_code:
      currency,

    cart_key:
      item?.cart_key ||
      item?.cartKey ||
      localItem?.cart_key ||
      localItem?.cartKey ||
      `${productId}-${currency}-${Number(
        normalizedAmount.toFixed(2)
      )}`,

    assign_coupons:
      Array.isArray(
        merged?.assign_coupons
      )
        ? merged.assign_coupons
        : Array.isArray(
            merged?.assignCoupons
          )
        ? merged.assignCoupons
        : [],

    coupons:
      Array.isArray(
        merged?.coupons
      )
        ? merged.coupons
        : getAssignedCoupons(
            merged
          ),
  };
}

function mergeServerCartWithLocal(
  serverCart
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return serverCart.map(
      (item) =>
        normalizeCartItem(item)
    );
  }

  let localCart = [];

  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (saved) {
      const parsed =
        JSON.parse(saved);

      if (
        Array.isArray(parsed)
      ) {
        localCart = parsed;
      }
    }
  } catch {
    localCart = [];
  }

  return serverCart.map(
    (serverItem) => {
      const serverProductId =
        String(
          getProductId(
            serverItem
          ) || ""
        );

      const serverCartKey =
        getCartKey(
          serverItem
        );

      const localItem =
        localCart.find(
          (local) => {
            const localProductId =
              String(
                getProductId(
                  local
                ) || ""
              );

            const localCartKey =
              getCartKey(
                local
              );

            return (
              localCartKey ===
                serverCartKey ||
              (
                localProductId ===
                  serverProductId &&
                getCurrency(
                  local
                ) ===
                  getCurrency(
                    serverItem
                  ) &&
                getItemAmount(
                  local
                ) ===
                  getItemAmount(
                    serverItem
                  )
              )
            );
          }
        );

      return normalizeCartItem(
        serverItem,
        localItem
      );
    }
  );
}

async function getServerCart() {
  const data =
    await cartApi("/cart");

  if (
    !Array.isArray(
      data?.cart
    )
  ) {
    return [];
  }

  return mergeServerCartWithLocal(
    data.cart
  );
}

export const CartProvider = ({
  children,
}) => {
  const [
    cartItems,
    setCartItems,
  ] = useState([]);

  const [
    coupon,
    setCouponState,
  ] = useState(null);

  const [
    paymentMethod,
    setPaymentMethodState,
  ] = useState("card");

  const [
    hydrated,
    setHydrated,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrateCart =
      async () => {
        try {
          const savedCoupon =
            localStorage.getItem(
              COUPON_STORAGE_KEY
            );

          if (savedCoupon) {
            try {
              const parsedCoupon =
                JSON.parse(
                  savedCoupon
                );

              if (
                parsedCoupon &&
                mounted
              ) {
                setCouponState(
                  parsedCoupon
                );
              }
            } catch {
              localStorage.removeItem(
                COUPON_STORAGE_KEY
              );
            }
          }

          getGuestCartToken();

          const serverCart =
            await getServerCart();

          if (mounted) {
            setCartItems(
              serverCart
            );

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(
                serverCart
              )
            );
          }
        } catch (error) {
          console.error(
            "CART SERVER HYDRATION ERROR:",
            error
          );

          try {
            const savedCart =
              localStorage.getItem(
                STORAGE_KEY
              );

            if (
              savedCart &&
              mounted
            ) {
              const parsed =
                JSON.parse(
                  savedCart
                );

              if (
                Array.isArray(
                  parsed
                )
              ) {
                setCartItems(
                  parsed.map(
                    (item) =>
                      normalizeCartItem(
                        item
                      )
                  )
                );
              }
            }
          } catch (
            localError
          ) {
            console.error(
              "CART LOCAL HYDRATION ERROR:",
              localError
            );
          }
        }

        if (mounted) {
          setHydrated(true);
        }
      };

    hydrateCart();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        cartItems
      )
    );
  }, [
    cartItems,
    hydrated,
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (coupon) {
      localStorage.setItem(
        COUPON_STORAGE_KEY,
        JSON.stringify(
          coupon
        )
      );
    } else {
      localStorage.removeItem(
        COUPON_STORAGE_KEY
      );
    }
  }, [
    coupon,
    hydrated,
  ]);

  const addToCart =
    useCallback(
      async (
        product,
        selectedAmount = null,
        quantity = 1
      ) => {
        try {
          const productId =
            getProductId(
              product
            );

          const currency =
            getCurrency(
              product
            );

          const amountFromArgument =
            selectedAmount !==
              null &&
            selectedAmount !==
              undefined
              ? numberValue(
                  selectedAmount,
                  0
                )
              : 0;

          const productAmount =
            getItemAmount(
              product
            );

          const amount =
            amountFromArgument >
              0
              ? amountFromArgument
              : productAmount;

          const safeQuantity =
            Math.max(
              1,
              Math.floor(
                numberValue(
                  quantity,
                  1
                )
              )
            );

          if (!productId) {
            console.error(
              "Product ID missing"
            );

            return false;
          }

          if (amount <= 0) {
            console.error(
              "Invalid amount:",
              amount
            );

            return false;
          }

          const normalizedAmount =
            Number(
              amount.toFixed(2)
            );

          const cartKey =
            `${productId}-${currency}-${Number(
              normalizedAmount.toFixed(
                2
              )
            )}`;

          const data =
            await cartApi(
              "/cart",
              {
                method: "POST",
                body: JSON.stringify(
                  {
                    product_id:
                      String(
                        productId
                      ),
                    quantity:
                      safeQuantity,
                    amount:
                      normalizedAmount,
                    currency_code:
                      currency,
                    cart_key:
                      cartKey,
                  }
                ),
              }
            );

          const serverItem =
            data?.item
              ? normalizeCartItem(
                  data.item,
                  product
                )
              : null;

          if (
            Array.isArray(
              data?.cart
            )
          ) {
            const serverCart =
              mergeServerCartWithLocal(
                data.cart
              );

            setCartItems(
              serverCart
            );

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(
                serverCart
              )
            );
          } else if (
            serverItem
          ) {
            setCartItems(
              (previous) => {
                const existing =
                  previous.find(
                    (item) =>
                      getCartKey(
                        item
                      ) ===
                      cartKey
                  );

                if (!existing) {
                  return [
                    ...previous,
                    serverItem,
                  ];
                }

                return previous.map(
                  (item) =>
                    getCartKey(
                      item
                    ) === cartKey
                      ? {
                          ...item,
                          ...serverItem,
                          quantity:
                            getItemQuantity(
                              serverItem
                            ),
                        }
                      : item
                );
              }
            );
          } else {
            const serverCart =
              await getServerCart();

            setCartItems(
              serverCart
            );
          }

          return true;
        } catch (error) {
          console.error(
            "ADD TO CART ERROR:",
            error
          );

          return false;
        }
      },
      []
    );

  const updateAmount =
    useCallback(
      async (
        itemOrCartKey,
        amount
      ) => {
        const currentCartKey =
          typeof itemOrCartKey ===
            "object"
            ? getCartKey(
                itemOrCartKey
              )
            : String(
                itemOrCartKey
              );

        const safeAmount =
          Math.max(
            0,
            numberValue(
              amount,
              0
            )
          );

        const normalizedAmount =
          Number(
            safeAmount.toFixed(2)
          );

        if (
          normalizedAmount <=
          0
        ) {
          return false;
        }

        const targetItem =
          cartItems.find(
            (item) =>
              getCartKey(
                item
              ) ===
              currentCartKey
          );

        if (!targetItem) {
          return false;
        }

        const productId =
          getProductId(
            targetItem
          );

        const currency =
          getCurrency(
            targetItem
          );

        const newCartKey =
          `${productId}-${currency}-${Number(
            normalizedAmount.toFixed(
              2
            )
          )}`;

        try {
          const itemId =
            getCartId(
              targetItem
            );

          if (!itemId) {
            return false;
          }

          await cartApi(
            `/cart/${encodeURIComponent(
              itemId
            )}`,
            {
              method: "PUT",
              body: JSON.stringify(
                {
                  amount:
                    normalizedAmount,
                  cart_key:
                    newCartKey,
                }
              ),
            }
          );

          const serverCart =
            await getServerCart();

          setCartItems(
            serverCart
          );

          return true;
        } catch (error) {
          console.error(
            "UPDATE AMOUNT ERROR:",
            error
          );

          return false;
        }
      },
      [cartItems]
    );

  const updateQuantity =
    useCallback(
      async (
        itemOrKey,
        newQuantity
      ) => {
        const cartKey =
          typeof itemOrKey ===
            "object"
            ? getCartKey(
                itemOrKey
              )
            : String(
                itemOrKey
              );

        const quantity =
          Math.max(
            1,
            Math.floor(
              numberValue(
                newQuantity,
                1
              )
            )
          );

        const item =
          cartItems.find(
            (cartItem) =>
              getCartKey(
                cartItem
              ) === cartKey
          );

        if (!item) {
          return false;
        }

        try {
          const itemId =
            getCartId(item);

          if (!itemId) {
            return false;
          }

          await cartApi(
            `/cart/${encodeURIComponent(
              itemId
            )}`,
            {
              method: "PUT",
              body: JSON.stringify(
                {
                  quantity,
                }
              ),
            }
          );

          setCartItems(
            (previous) =>
              previous.map(
                (cartItem) => {
                  if (
                    getCartKey(
                      cartItem
                    ) !== cartKey
                  ) {
                    return cartItem;
                  }

                  return {
                    ...cartItem,
                    quantity,
                  };
                }
              )
          );

          return true;
        } catch (error) {
          console.error(
            "UPDATE QUANTITY ERROR:",
            error
          );

          return false;
        }
      },
      [cartItems]
    );

  const removeFromCart =
    useCallback(
      async (
        itemOrCartKey
      ) => {
        const cartKey =
          typeof itemOrCartKey ===
            "object"
            ? getCartKey(
                itemOrCartKey
              )
            : String(
                itemOrCartKey
              );

        const item =
          cartItems.find(
            (cartItem) =>
              getCartKey(
                cartItem
              ) === cartKey
          );

        if (!item) {
          return false;
        }

        try {
          const itemId =
            getCartId(item);

          if (!itemId) {
            return false;
          }

          await cartApi(
            `/cart/${encodeURIComponent(
              itemId
            )}`,
            {
              method: "DELETE",
            }
          );

          setCartItems(
            (previous) =>
              previous.filter(
                (cartItem) =>
                  getCartKey(
                    cartItem
                  ) !== cartKey
              )
          );

          return true;
        } catch (error) {
          console.error(
            "REMOVE CART ERROR:",
            error
          );

          return false;
        }
      },
      [cartItems]
    );

  const clearCart =
    useCallback(
      async () => {
        try {
          await cartApi(
            "/cart/clear",
            {
              method: "DELETE",
            }
          );
        } catch (error) {
          console.error(
            "CLEAR CART SERVER ERROR:",
            error
          );
        }

        setCartItems([]);

        setCouponState(null);

        localStorage.removeItem(
          STORAGE_KEY
        );

        localStorage.removeItem(
          COUPON_STORAGE_KEY
        );
      },
      []
    );

  const mergeGuestCart =
    useCallback(
      async () => {
        try {
          const customerToken =
            localStorage.getItem(
              CUSTOMER_TOKEN_KEY
            );

          if (!customerToken) {
            return false;
          }

          const cartToken =
            getGuestCartToken();

          if (!cartToken) {
            return false;
          }

          const data =
            await cartApi(
              "/cart/merge",
              {
                method: "POST",
                body: JSON.stringify(
                  {
                    cart_token:
                      cartToken,
                  }
                ),
              }
            );

          if (
            Array.isArray(
              data?.cart
            )
          ) {
            const serverCart =
              mergeServerCartWithLocal(
                data.cart
              );

            setCartItems(
              serverCart
            );

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(
                serverCart
              )
            );
          } else {
            const serverCart =
              await getServerCart();

            setCartItems(
              serverCart
            );
          }

          return true;
        } catch (error) {
          console.error(
            "CART MERGE ERROR:",
            error
          );

          return false;
        }
      },
      []
    );

  useEffect(() => {
    const handleCustomerLogin =
      async () => {
        await mergeGuestCart();
      };

    window.addEventListener(
      "customer-login",
      handleCustomerLogin
    );

    return () => {
      window.removeEventListener(
        "customer-login",
        handleCustomerLogin
      );
    };
  }, [
    mergeGuestCart,
  ]);

  const setCoupon =
    useCallback(
      (newCoupon) => {
        if (!newCoupon) {
          setCouponState(null);
          return;
        }

        setCouponState(
          newCoupon
        );
      },
      []
    );

  const removeCoupon =
    useCallback(() => {
      setCouponState(null);
    }, []);

  const setPaymentMethod =
    useCallback(
      (method) => {
        const normalized =
          String(
            method || "card"
          )
            .toLowerCase()
            .replace(
              /[\s-]+/g,
              "_"
            );

        setPaymentMethodState(
          normalized
        );

        setCouponState(
          (currentCoupon) => {
            if (!currentCoupon) {
              return getBestAutomaticCoupon(
                cartItems,
                normalized
              );
            }

            const eligible =
              cartItems.some(
                (item) => {
                  if (
                    !isCouponAssignedToProduct(
                      item,
                      currentCoupon
                    )
                  ) {
                    return false;
                  }

                  if (
                    !couponCurrencyMatches(
                      item,
                      currentCoupon
                    )
                  ) {
                    return false;
                  }

                  if (
                    !isCouponPaymentMethodAllowed(
                      currentCoupon,
                      normalized
                    )
                  ) {
                    return false;
                  }

                  return (
                    calculateCouponDiscount(
                      getItemSubtotal(
                        item
                      ),
                      currentCoupon
                    ) > 0
                  );
                }
              );

            if (eligible) {
              return currentCoupon;
            }

            return (
              getBestAutomaticCoupon(
                cartItems,
                normalized
              ) || null
            );
          }
        );
      },
      [cartItems]
    );

  const availableCoupons =
    useMemo(() => {
      const map = new Map();

      cartItems.forEach(
        (item) => {
          const assigned =
            getAssignedCoupons(
              item
            );

          assigned.forEach(
            (itemCoupon) => {
              const code =
                getCouponCode(
                  itemCoupon
                );

              if (!code) {
                return;
              }

              if (
                !isCouponPaymentMethodAllowed(
                  itemCoupon,
                  paymentMethod
                )
              ) {
                return;
              }

              if (
                !couponCurrencyMatches(
                  item,
                  itemCoupon
                )
              ) {
                return;
              }

              const discount =
                calculateCouponDiscount(
                  getItemSubtotal(
                    item
                  ),
                  itemCoupon
                );

              if (discount <= 0) {
                return;
              }

              if (!map.has(code)) {
                map.set(
                  code,
                  {
                    ...itemCoupon,

                    code,

                    coupon_code:
                      code,

                    eligible_products:
                      [],

                    total_possible_discount:
                      0,
                  }
                );
              }

              const existing =
                map.get(code);

              existing.eligible_products.push(
                getProductId(
                  item
                )
              );

              existing.total_possible_discount +=
                discount;
            }
          );
        }
      );

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.total_possible_discount -
          a.total_possible_discount
      );
    }, [
      cartItems,
      paymentMethod,
    ]);

  const couponBreakdown =
    useMemo(() => {
      return cartItems.map(
        (item) => {
          const originalSubtotal =
            getItemSubtotal(
              item
            );

          if (!coupon) {
            return {
              ...item,

              cart_key:
                getCartKey(
                  item
                ),

              quantity:
                getItemQuantity(
                  item
                ),

              original_subtotal:
                originalSubtotal,

              coupon_discount:
                0,

              final_subtotal:
                originalSubtotal,

              coupon_applied:
                false,
            };
          }

          const assignedCoupon =
            findCouponOnProduct(
              item,
              getCouponCode(
                coupon
              )
            );

          const assigned =
            Boolean(
              assignedCoupon
            );

          const paymentAllowed =
            isCouponPaymentMethodAllowed(
              coupon,
              paymentMethod
            );

          const currencyAllowed =
            couponCurrencyMatches(
              item,
              coupon
            );

          const eligible =
            assigned &&
            paymentAllowed &&
            currencyAllowed;

          const discount =
            eligible
              ? calculateCouponDiscount(
                  originalSubtotal,
                  coupon
                )
              : 0;

          const finalSubtotal =
            Math.max(
              0,
              originalSubtotal -
                discount
            );

          return {
            ...item,

            quantity:
              getItemQuantity(
                item
              ),

            cart_key:
              getCartKey(
                item
              ),

            original_subtotal:
              originalSubtotal,

            coupon_discount:
              Number(
                discount.toFixed(
                  2
                )
              ),

            final_subtotal:
              Number(
                finalSubtotal.toFixed(
                  2
                )
              ),

            coupon_applied:
              discount > 0,

            coupon_assigned:
              assigned,

            coupon_payment_allowed:
              paymentAllowed,
          };
        }
      );
    }, [
      cartItems,
      coupon,
      paymentMethod,
    ]);

  const subtotal =
    useMemo(() => {
      return Number(
        cartItems
          .reduce(
            (
              total,
              item
            ) =>
              total +
              getItemSubtotal(
                item
              ),
            0
          )
          .toFixed(2)
      );
    }, [cartItems]);

  const discount =
    useMemo(() => {
      return Number(
        couponBreakdown
          .reduce(
            (
              total,
              item
            ) =>
              total +
              numberValue(
                item.coupon_discount,
                0
              ),
            0
          )
          .toFixed(2)
      );
    }, [
      couponBreakdown,
    ]);

  const total =
    useMemo(() => {
      return Number(
        Math.max(
          0,
          subtotal -
            discount
        ).toFixed(2)
      );
    }, [
      subtotal,
      discount,
    ]);

  const itemCount =
    useMemo(() => {
      return cartItems.reduce(
        (
          total,
          item
        ) =>
          total +
          getItemQuantity(
            item
          ),
        0
      );
    }, [cartItems]);

  const getCouponDiscountForItem =
    useCallback(
      (
        item,
        selectedCoupon = coupon,
        selectedPaymentMethod = paymentMethod
      ) => {
        if (
          !item ||
          !selectedCoupon
        ) {
          return 0;
        }

        if (
          !isCouponAssignedToProduct(
            item,
            selectedCoupon
          )
        ) {
          return 0;
        }

        if (
          !isCouponPaymentMethodAllowed(
            selectedCoupon,
            selectedPaymentMethod
          )
        ) {
          return 0;
        }

        if (
          !couponCurrencyMatches(
            item,
            selectedCoupon
          )
        ) {
          return 0;
        }

        return calculateCouponDiscount(
          getItemSubtotal(
            item
          ),
          selectedCoupon
        );
      },
      [
        coupon,
        paymentMethod,
      ]
    );

  const value = useMemo(
    () => ({
      cartItems,
      setCartItems,

      coupon,
      setCoupon,
      removeCoupon,

      paymentMethod,
      setPaymentMethod,

      availableCoupons,
      couponBreakdown,

      subtotal,
      discount,
      total,
      itemCount,

      addToCart,
      updateQuantity,
      updateAmount,
      removeFromCart,
      clearCart,
      mergeGuestCart,

      getCouponDiscountForItem,

      getCouponCode,
      getCouponName,
      getCouponPaymentLabel,
      formatCurrency,

      hydrated,

      getProductId,
      getProductName,
      getCurrency,
      getItemAmount,
      getItemQuantity,
      getItemSubtotal,
      getCartKey,
      getBaseCartKey,
      isFirstUserCoupon,
    }),
    [
      cartItems,
      coupon,
      setCoupon,
      removeCoupon,
      paymentMethod,
      setPaymentMethod,
      availableCoupons,
      couponBreakdown,
      subtotal,
      discount,
      total,
      itemCount,
      addToCart,
      updateQuantity,
      updateAmount,
      removeFromCart,
      clearCart,
      mergeGuestCart,
      getCouponDiscountForItem,
      hydrated,
    ]
  );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
};

export default CartContext;