import { HTTP_ROUTE_UNMATCHED } from "@/common/constants";

import { httpRouteTemplate } from "./http-route-template";

describe("httpRouteTemplate", () => {
  it("joins baseUrl with the Express route path", () => {
    expect(
      httpRouteTemplate({
        baseUrl: "/api/v1/issues",
        route: { path: "/:id" },
      })
    ).toBe("/api/v1/issues/:id");
  });

  it("returns unmatched when no route was selected", () => {
    expect(httpRouteTemplate({ baseUrl: "/api/v1/missing" })).toBe(
      HTTP_ROUTE_UNMATCHED
    );
  });

  it("normalizes a lone slash to /", () => {
    expect(httpRouteTemplate({ baseUrl: "", route: { path: "/" } })).toBe("/");
  });
});
