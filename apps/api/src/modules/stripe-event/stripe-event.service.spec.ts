import { StripeEventRepository } from "./stripe-event.repository";
import { StripeEventService } from "./stripe-event.service";

describe("StripeEventService.insert", () => {
  const createMany = jest.fn();

  const service = new StripeEventService({
    createMany,
  } as unknown as StripeEventRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns created when the event id is new", async () => {
    createMany.mockResolvedValue({ count: 1 });

    await expect(
      service.insert({ id: "evt_1", type: "customer.subscription.updated" })
    ).resolves.toEqual({ outcome: "created" });

    expect(createMany).toHaveBeenCalledWith(
      {
        data: [{ id: "evt_1", type: "customer.subscription.updated" }],
        skipDuplicates: true,
      },
      undefined
    );
  });

  it("returns already_processed when skipDuplicates inserts nothing", async () => {
    createMany.mockResolvedValue({ count: 0 });

    await expect(
      service.insert({ id: "evt_1", type: "customer.subscription.updated" })
    ).resolves.toEqual({ outcome: "already_processed" });
  });
});
