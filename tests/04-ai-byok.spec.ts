import { test, expect } from "@playwright/test";

test.describe("AI BYOK gate", () => {
  test("with no key, Draft reply is disabled and shows the hint", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("conversation-row").first().click();

    await expect(page.getByTestId("ai-gate-hint")).toBeVisible();
    await expect(page.getByTestId("ai-gate-hint")).toContainText("Settings to enable AI");
    await expect(page.getByTestId("agent-draft")).toBeDisabled();
    await expect(page.getByTestId("agent-summarize")).toBeDisabled();
  });

  test("with mock provider, Draft reply and Summarize return deterministic output", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("conversation-row").filter({ hasText: "Maya Chen" }).click();

    // Enable the deterministic mock agent via Settings (no real key).
    await page.getByTestId("open-settings").click();
    await page.getByTestId("use-mock").click();

    // Gate is gone; buttons enabled.
    await expect(page.getByTestId("ai-gate-hint")).toHaveCount(0);
    await expect(page.getByTestId("agent-draft")).toBeEnabled();

    // Draft reply -> deterministic suggested reply.
    await page.getByTestId("agent-draft").click();
    const reply = page.getByTestId("agent-suggested-reply");
    await expect(reply).toBeVisible();
    await expect(reply).toContainText("Thanks for reaching out, Maya");

    // The suggested reply can be pushed into the composer.
    await page.getByTestId("agent-use-reply").click();
    await expect(page.getByTestId("composer-input")).toHaveValue(
      /Thanks for reaching out, Maya/,
    );

    // Summarize -> a summary card.
    await page.getByTestId("agent-summarize").click();
    const summary = page.getByTestId("agent-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Maya Chen");

    // Detect intent -> intent + nextAction tags.
    await page.getByTestId("agent-intent").click();
    await expect(page.getByTestId("agent-intent-result")).toContainText("intent:");
    await expect(page.getByTestId("agent-intent-result")).toContainText("next action:");
  });
});
