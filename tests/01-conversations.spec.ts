import { test, expect } from "@playwright/test";

test.describe("conversations list", () => {
  test("renders conversations across multiple channels", async ({ page }) => {
    await page.goto("/");

    const rows = page.getByTestId("conversation-row");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThanOrEqual(5);

    // All three channels are represented in the seeded data.
    await expect(page.getByTestId("channel-badge-sms").first()).toBeVisible();
    await expect(page.getByTestId("channel-badge-voice").first()).toBeVisible();
    await expect(page.getByTestId("channel-badge-rcs").first()).toBeVisible();
  });

  test("clicking a conversation shows its messages", async ({ page }) => {
    await page.goto("/");

    // Click the SMS conversation with Maya Chen.
    await page.getByTestId("conversation-row").filter({ hasText: "Maya Chen" }).click();

    const thread = page.getByTestId("thread-messages");
    await expect(thread).toBeVisible();
    await expect(thread.getByTestId("message").first()).toBeVisible();
    await expect(thread).toContainText("pricing");
  });

  test("channel filter narrows the list to voice", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-voice").click();

    const badges = page.getByTestId("conversation-list").getByTestId("channel-badge-voice");
    await expect(badges.first()).toBeVisible();
    // No SMS badges should remain in the filtered list.
    await expect(
      page.getByTestId("conversation-list").getByTestId("channel-badge-sms"),
    ).toHaveCount(0);
  });
});
