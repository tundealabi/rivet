import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { PiBuildingOffice } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

import { AppSidebar, useLogout } from "../components/app/AppSidebar";

export default function OnboardingPage() {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} collapsed />

      <Flex flex="1" align="center" justify="center" px="6" py="12">
        <Stack
          maxW="md"
          w="full"
          align="center"
          textAlign="center"
          gap="5"
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="card"
          px="8"
          py="10"
          boxShadow="subtle"
        >
          <Flex
            boxSize="14"
            align="center"
            justify="center"
            borderRadius="card"
            bg="brand.subtle"
            color="accent.default"
          >
            <PiBuildingOffice size={28} />
          </Flex>
          <Box>
            <Heading size="lg" color="fg.primary" letterSpacing="-0.02em">
              Create your organization
            </Heading>
            <Text fontSize="sm" color="fg.secondary" mt="2" lineHeight="1.6">
              Rivet works best when you have a workspace. Create an organization
              to start tracking projects and issues with your team.
            </Text>
          </Box>
          <Button
            borderRadius="full"
            bg="accent.default"
            color="white"
            fontWeight="semibold"
            _hover={{ bg: "accent.hover" }}
            onClick={() => void navigate("/onboarding/create-org")}
          >
            Create organization
          </Button>
        </Stack>
      </Flex>
    </Flex>
  );
}
