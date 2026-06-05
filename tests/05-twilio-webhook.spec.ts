import { test, expect } from "@playwright/test";
import { signSimulatorRequest } from "../lib/twilio-sign";

const PORT = 3137;

test.describe("Twilio inbound webhook signature verification", () => {
  test("returns 403 when X-Twilio-Signature is missing", async ({ request }) => {
    const res = await request.post("/api/twilio/inbound", {
      form: { From: "+14155550112", Body: "hello", MessageSid: "SM123" },
    });
    expect(res.status()).toBe(403);
  });

  test("returns 403 when X-Twilio-Signature is invalid", async ({ request }) => {
    const res = await request.post("/api/twilio/inbound", {
      form: { From: "+14155550112", Body: "hello", MessageSid: "SM123" },
      headers: { "X-Twilio-Signature": "not-a-valid-signature" },
    });
    expect(res.status()).toBe(403);
  });

  test("accepts a correctly signed simulator webhook (200)", async ({ request }) => {
    const url = `http://localhost:${PORT}/api/twilio/inbound`;
    const params = {
      From: "+14155550112",
      Body: "Signed inbound from the webhook test",
      MessageSid: "SM_signed_1",
    };
    const signature = signSimulatorRequest(url, params);

    const res = await request.post("/api/twilio/inbound", {
      form: params,
      headers: { "X-Twilio-Signature": signature },
    });
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("<Response>");
  });
});
