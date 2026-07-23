import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiNutFill } from "react-icons/pi";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { slugifyOrganizationName } from "../components/app/org-switcher-api";
import { useCreateOrganizationMutation } from "../components/app/use-org-switcher-queries";
import { useActiveOrg } from "../components/billing/use-active-org";
import { transition } from "../components/issues/issues-motion";

function BrandHeader() {
  return (
    <RouterLink to="/" style={{ textDecoration: "none" }}>
      <Flex align="center" gap="2.5">
        <Box color="accent.default" lineHeight="0">
          <PiNutFill size={28} />
        </Box>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color="fg.primary"
          letterSpacing="-0.02em"
        >
          Rivet
        </Text>
      </Flex>
    </RouterLink>
  );
}

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const { switchOrg } = useActiveOrg();
  const createOrg = useCreateOrganizationMutation();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyOrganizationName(value));
    }
  };

  const canSubmit = useMemo(
    () => name.trim().length >= 2 && slug.trim().length >= 2,
    [name, slug]
  );

  const handleSubmit = () => {
    if (!canSubmit) return;

    createOrg.mutate(
      {
        name: name.trim(),
        slug: slug.trim(),
      },
      {
        onSuccess: ({ orgId: newOrgId }) => {
          toast.success("Organization created");
          void switchOrg(newOrgId).then((switched) => {
            if (switched) {
              void navigate("/projects");
            }
          });
        },
        onError: () => toast.error("Couldn't create organization — try again"),
      }
    );
  };

  return (
    <Flex
      minH="100svh"
      bg="bg.canvas"
      align="center"
      justify="center"
      px="5"
      py="12"
    >
      <Box w="full" maxW="md">
        <BrandHeader />

        <Stack gap="6" mt="10">
          <Box>
            <Heading size="lg" color="fg.primary" letterSpacing="-0.02em">
              Create organization
            </Heading>
            <Text mt="2" fontSize="sm" color="fg.secondary" lineHeight="1.6">
              Set up a new workspace. You&apos;ll be the Owner and can invite
              your team afterward.
            </Text>
          </Box>

          <Stack gap="4">
            <Field.Root>
              <Field.Label fontSize="sm" fontWeight="medium" color="fg.primary">
                Organization name
              </Field.Label>
              <Input
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Acme Inc."
                borderRadius="control"
                borderColor="border.default"
                bg="bg.surface"
                transition={transition.base}
                _focusVisible={{
                  borderColor: "accent.default",
                  outline: "2px solid",
                  outlineColor: "rgba(79, 70, 229, 0.2)",
                  outlineOffset: "0",
                }}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label fontSize="sm" fontWeight="medium" color="fg.primary">
                URL slug
              </Field.Label>
              <Input
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugifyOrganizationName(event.target.value));
                }}
                placeholder="acme-inc"
                borderRadius="control"
                borderColor="border.default"
                bg="bg.surface"
                transition={transition.base}
                _focusVisible={{
                  borderColor: "accent.default",
                  outline: "2px solid",
                  outlineColor: "rgba(79, 70, 229, 0.2)",
                  outlineOffset: "0",
                }}
              />
              <Field.HelperText fontSize="xs" color="fg.muted">
                Used in invite links and workspace URLs.
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label fontSize="sm" fontWeight="medium" color="fg.primary">
                Logo (optional)
              </Field.Label>
              <Box
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="border.default"
                borderRadius="control"
                px="4"
                py="6"
                textAlign="center"
                color="fg.muted"
                fontSize="sm"
              >
                Logo upload coming soon
              </Box>
            </Field.Root>
          </Stack>

          <Flex gap="3" justify="flex-end">
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => void navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              fontWeight="semibold"
              disabled={!canSubmit}
              loading={createOrg.isPending}
              onClick={handleSubmit}
              _hover={{ bg: "accent.hover" }}
            >
              Create organization
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Flex>
  );
}
