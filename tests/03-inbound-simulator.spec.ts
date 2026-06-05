import { test, expect } from "@playwright/test";

test("inbound simulator delivers a new inbound message into a thread", async ({
  page,
  request,
}) => {
  await page.goto("/");

  // Open the Orbit Logistics RCS thread.
  await page
    .getByTestId("conversation-row")
    .filter({ hasText: "Orbit Logistics" })
    .click();

  const thread = page.getByTestId("thread-messages");
  const inboundLocator = thread.locator(
    '[data-testid="message"][data-direction="inbound"]',
  );
  const before = await inboundLocator.count();

  // Deterministic test hook: target this exact conversation via the simulator API.
  const res = await request.post("/api/simulator", {
    data: { conversationId: "conv_orbit" },
  });
  expect(res.ok()).toBeTruthy();
  const { message } = await res.json();
  expect(message.direction).toBe("inbound");
  expect(message.conversationId).toBe("conv_orbit");

  // The UI polls; the new inbound message shows up in the open thread.
  await expect.poll(() => inboundLocator.count(), { timeout: 8000 }).toBeGreaterThan(
    before,
  );
  await expect(thread.getByText(message.body)).toBeVisible();
});
