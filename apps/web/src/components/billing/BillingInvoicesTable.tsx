import { Box, Button, Flex, Link, Table, Text } from "@chakra-ui/react";
import { PiArrowSquareOut } from "react-icons/pi";

import { fadeInUp } from "../issues/issues-motion";
import {
  formatInvoiceDate,
  type Invoice,
  type InvoiceStatus,
  type OrgSubscription,
} from "./billing-types";

const CARD_BORDER = "border.default";
const FG_PRIMARY = "fg.primary";
const FG_MUTED = "fg.secondary";

const STATUS_STYLES: Record<
  InvoiceStatus,
  { label: string; bg: string; color: string }
> = {
  paid: { label: "Paid", bg: "billing.paid.bg", color: "billing.paid.fg" },
  pending: {
    label: "Pending",
    bg: "billing.pending.bg",
    color: "billing.pending.fg",
  },
  failed: {
    label: "Failed",
    bg: "billing.failed.bg",
    color: "billing.failed.fg",
  },
};

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <Text
      as="span"
      display="inline-block"
      fontSize="xs"
      fontWeight="semibold"
      px="2.5"
      py="0.5"
      borderRadius="badge"
      bg={style.bg}
      color={style.color}
    >
      {style.label}
    </Text>
  );
}

interface BillingInvoicesTableProps {
  invoices: Invoice[];
  subscription: OrgSubscription;
  canManage: boolean;
  onOpenPortal: () => void;
  portalLoading?: boolean;
}

export function BillingInvoicesTable({
  invoices,
  subscription,
  canManage,
  onOpenPortal,
  portalLoading = false,
}: BillingInvoicesTableProps) {
  const isFree = subscription.planTier === "FREE";
  const empty = invoices.length === 0;

  return (
    <Box mt="12" {...fadeInUp}>
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color={FG_PRIMARY}
        letterSpacing="-0.01em"
        mb="1"
      >
        Invoices
      </Text>
      <Text fontSize="sm" color={FG_MUTED} mb="6">
        Recent billing history from Stripe
      </Text>

      {empty ? (
        <Box
          borderWidth="1px"
          borderColor={CARD_BORDER}
          borderRadius="card"
          bg="bg.surface"
          px="6"
          py="10"
          textAlign="center"
        >
          <Text fontSize="sm" color={FG_MUTED}>
            {isFree
              ? "No invoices yet — upgrade to a paid plan to see your billing history."
              : "No invoices yet."}
          </Text>
        </Box>
      ) : (
        <Box
          borderWidth="1px"
          borderColor={CARD_BORDER}
          borderRadius="card"
          overflow="hidden"
          bg="bg.surface"
        >
          <Box overflowX="auto">
            <Table.Root size="sm" minW="640px">
              <Table.Header>
                <Table.Row bg="bg.surfaceHover">
                  <Table.ColumnHeader
                    py="3"
                    px="4"
                    fontWeight="medium"
                    color={FG_MUTED}
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                  >
                    Date
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    py="3"
                    px="4"
                    fontWeight="medium"
                    color={FG_MUTED}
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                  >
                    Description
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    py="3"
                    px="4"
                    fontWeight="medium"
                    color={FG_MUTED}
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                  >
                    Amount
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    py="3"
                    px="4"
                    fontWeight="medium"
                    color={FG_MUTED}
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                  >
                    Status
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    py="3"
                    px="4"
                    fontWeight="medium"
                    color={FG_MUTED}
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                  >
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {invoices.map((invoice) => (
                  <Table.Row key={invoice.id} borderColor={CARD_BORDER}>
                    <Table.Cell
                      py="3.5"
                      px="4"
                      fontSize="sm"
                      color={FG_PRIMARY}
                    >
                      {formatInvoiceDate(invoice.date)}
                    </Table.Cell>
                    <Table.Cell py="3.5" px="4" fontSize="sm" color={FG_MUTED}>
                      {invoice.description}
                    </Table.Cell>
                    <Table.Cell
                      py="3.5"
                      px="4"
                      fontSize="sm"
                      color={FG_PRIMARY}
                      fontWeight="medium"
                    >
                      {invoice.amountDisplay}
                    </Table.Cell>
                    <Table.Cell py="3.5" px="4">
                      <Flex align="center" gap="2" flexWrap="wrap">
                        <InvoiceStatusBadge status={invoice.status} />
                        {invoice.status === "failed" && canManage && (
                          <Button
                            size="xs"
                            variant="outline"
                            borderRadius="control"
                            borderColor="status.error"
                            color="status.error"
                            fontWeight="semibold"
                            loading={portalLoading}
                            onClick={onOpenPortal}
                          >
                            Retry payment
                          </Button>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell py="3.5" px="4">
                      <Link
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        fontSize="sm"
                        color="accent.default"
                        fontWeight="medium"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Download PDF
                      </Link>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}

      {canManage && !empty && (
        <Flex mt="4">
          <Link
            as="button"
            display="inline-flex"
            alignItems="center"
            gap="1.5"
            fontSize="sm"
            color="accent.default"
            fontWeight="medium"
            _hover={{ textDecoration: "underline" }}
            aria-disabled={portalLoading}
            opacity={portalLoading ? 0.7 : 1}
            pointerEvents={portalLoading ? "none" : "auto"}
            onClick={onOpenPortal}
          >
            View all invoices in Stripe portal
            <PiArrowSquareOut size={15} />
          </Link>
        </Flex>
      )}
    </Box>
  );
}
