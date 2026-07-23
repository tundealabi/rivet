import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  PiBugBeetle,
  PiChatCircleDots,
  PiFolderOpenDuotone,
  PiPlusBold,
  PiSignOut,
} from "react-icons/pi";
import { useNavigate } from "react-router-dom";

import { isSessionExpiredError } from "../auth-api";
import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import { SitewidePaymentWarning } from "../components/billing/SitewidePaymentWarning";
import { useActiveOrg } from "../components/billing/use-active-org";
import { useBillingSummary } from "../components/billing/use-billing-queries";
import { MOCK_PROJECTS as SEED_PROJECTS } from "../components/projects/mock-projects-data";
import type { Project } from "../components/projects/project-types";
import {
  createProject,
  CreateProjectError,
} from "../components/projects/projects-api";

const PROJECT_COLORS = [
  "#4F46E5",
  "#0891B2",
  "#DB2777",
  "#D97706",
  "#16A34A",
  "#7C3AED",
];

/** Free plan project cap — used for upgrade nudge on the list page. */
// const FREE_PLAN_PROJECT_LIMIT = 3;

function keyFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      p="5"
      cursor="pointer"
      boxShadow="subtle"
      transition="box-shadow 0.2s, transform 0.2s, border-color 0.2s"
      _hover={{
        boxShadow: "hover",
        transform: "translateY(-2px)",
        borderColor: "accent.default",
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <HStack gap="3" mb="4">
        <Flex
          boxSize="11"
          align="center"
          justify="center"
          borderRadius="control"
          bg={project.color}
          color="white"
          fontWeight="bold"
          fontSize="sm"
          flexShrink="0"
        >
          {project.key.slice(0, 2)}
        </Flex>
        <Box minW="0">
          <Text fontWeight="semibold" color="fg.primary" truncate>
            {project.name}
          </Text>
          <Badge
            size="sm"
            variant="subtle"
            colorPalette="gray"
            fontFamily="mono"
            mt="0.5"
          >
            {project.key}
          </Badge>
        </Box>
      </HStack>

      <Text fontSize="sm" color="fg.secondary" lineClamp={2} minH="10">
        {project.description || "No description yet."}
      </Text>

      <HStack
        mt="4"
        pt="4"
        borderTopWidth="1px"
        borderColor="border.divider"
        justify="space-between"
      >
        <HStack gap="4" color="fg.muted" fontSize="xs">
          <HStack gap="1">
            <PiBugBeetle size={14} />
            <Text>0 issues</Text>
          </HStack>
          <HStack gap="1">
            <PiChatCircleDots size={14} />
            <Text>0 comments</Text>
          </HStack>
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          {project.createdAt.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </HStack>
    </Box>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="24"
      px="6"
      borderWidth="1.5px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
    >
      <Flex
        boxSize="20"
        align="center"
        justify="center"
        borderRadius="full"
        bg="brand.subtle"
        color="accent.default"
        mb="6"
      >
        <PiFolderOpenDuotone size={40} />
      </Flex>
      <Heading size="lg" color="fg.primary" mb="2">
        Create your first project
      </Heading>
      <Text fontSize="sm" color="fg.secondary" maxW="sm" mb="8">
        Projects keep your team's issues organized. Create one to start tracking
        work, assigning teammates, and shipping faster.
      </Text>
      <Button
        size="lg"
        borderRadius="full"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        _hover={{ bg: "accent.hover" }}
        onClick={onCreate}
      >
        <PiPlusBold /> Create project
      </Button>
    </Flex>
  );
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: Project) => void;
  nextColorIndex: number;
  orgId: string;
}

function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
  nextColorIndex,
  orgId,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const reset = () => {
    setName("");
    setKey("");
    setKeyTouched(false);
    setDescription("");
    setNameError("");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createProject(
        orgId,
        {
          name: name.trim(),
          description: description.trim(),
        },
        {
          key: key.trim() || keyFromName(name),
          color: PROJECT_COLORS[nextColorIndex % PROJECT_COLORS.length],
        }
      ),
    onSuccess: (project) => {
      onCreate(project);
      reset();
      onOpenChange(false);
      toast.success("Project created");
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(
        error instanceof CreateProjectError
          ? error.message
          : "Unable to create project"
      );
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    if (!keyTouched) setKey(keyFromName(value));
    if (nameError && value.trim()) setNameError("");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setNameError("Please enter a project name");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) reset();
        onOpenChange(e.open);
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.surface"
          borderRadius="card"
          maxW="md"
          w="full"
          mx="4"
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">New project</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Field.Root invalid={!!nameError}>
                <Field.Label color="fg.primary">Project name</Field.Label>
                <Input
                  placeholder="e.g. Mobile App"
                  borderRadius="control"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus
                />
                <Field.ErrorText>{nameError}</Field.ErrorText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="fg.primary">Key</Field.Label>
                <Input
                  placeholder="e.g. MOB"
                  borderRadius="control"
                  fontFamily="mono"
                  maxW="32"
                  value={key}
                  onChange={(e) => {
                    setKeyTouched(true);
                    setKey(e.target.value.toUpperCase().slice(0, 5));
                  }}
                />
                <Field.HelperText color="fg.muted">
                  Used as a prefix for issue IDs, e.g. {key || "KEY"}-42
                </Field.HelperText>
              </Field.Root>

              <Field.Root>
                <Field.Label color="fg.primary">
                  Description{" "}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (optional)
                  </Text>
                </Field.Label>
                <Textarea
                  placeholder="What is this project about?"
                  borderRadius="control"
                  rows={3}
                  resize="none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field.Root>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="outline"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              _hover={{ bg: "accent.hover" }}
              onClick={handleCreate}
              loading={createMutation.isPending}
            >
              Create project
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(() =>
    SEED_PROJECTS.filter((project) => project.status === "active")
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const logout = useLogout();
  const navigate = useNavigate();
  const { orgId } = useActiveOrg();
  const billingQuery = useBillingSummary(orgId);
  const paymentPastDue = billingQuery.data?.subscription.pastDue === true;
  // const atProjectLimit = projects.length >= FREE_PLAN_PROJECT_LIMIT;

  const handleNewProjectClick = () => {
    // if (atProjectLimit) {
    //   toast("Upgrade your plan to create more projects", {
    //     icon: "✨",
    //     style: { fontSize: "14px" },
    //   });
    //   return;
    // }
    setDialogOpen(true);
  };

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />

      <Box flex="1" minW="0" display="flex" flexDirection="column">
        {paymentPastDue && <SitewidePaymentWarning />}

        {/* Top bar */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={{ base: "5", md: "10" }}
          py="5"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
          gap="4"
        >
          <Box>
            <Heading size="xl" color="fg.primary" letterSpacing="-0.02em">
              Projects
            </Heading>
            <Text fontSize="sm" color="fg.secondary" mt="0.5">
              {projects.length === 0
                ? "No projects yet"
                : `${projects.length} project${projects.length > 1 ? "s" : ""} in Acme Inc.`}
            </Text>
          </Box>
          <HStack gap="3">
            <Button
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              fontWeight="medium"
              display={{ base: "inline-flex", md: "none" }}
              _hover={{
                bg: "danger.ghostHover",
                color: "status.error",
                borderColor: "status.error",
              }}
              onClick={logout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>
            {projects.length > 0 && (
              <Box textAlign={{ base: "left", md: "right" }}>
                <Button
                  borderRadius="full"
                  bg="accent.default"
                  color="white"
                  fontWeight="semibold"
                  _hover={{ bg: "accent.hover" }}
                  onClick={handleNewProjectClick}
                >
                  <PiPlusBold /> New project
                </Button>
                {/* {atProjectLimit && (
                  <Text fontSize="xs" color="fg.muted" mt="1.5">
                    Free plan limit reached ·{" "}
                    <Box
                      as="button"
                      display="inline"
                      color="accent.default"
                      fontWeight="medium"
                      cursor="pointer"
                      bg="transparent"
                      border="none"
                      p="0"
                      fontSize="inherit"
                      onClick={() =>
                        toast("Billing upgrades coming soon", { icon: "🚀" })
                      }
                    >
                      Upgrade
                    </Box>
                  </Text>
                )} */}
              </Box>
            )}
          </HStack>
        </Flex>

        {/* Content */}
        <Box px={{ base: "5", md: "10" }} py="8">
          {projects.length === 0 ? (
            <EmptyState onCreate={handleNewProjectClick} />
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => void navigate(`/projects/${project.id}`)}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={(project) => setProjects((prev) => [...prev, project])}
        nextColorIndex={projects.length}
        orgId={orgId}
      />
    </Flex>
  );
}
