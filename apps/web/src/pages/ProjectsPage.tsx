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
import { EASE_OUT, transition } from "../components/issues/issues-motion";
import type { Project } from "../components/projects/project-types";
import {
  ProjectsListErrorState,
  ProjectsListSkeleton,
} from "../components/projects/ProjectPageStates";
import {
  CreateProjectError,
  PROJECT_COLORS,
} from "../components/projects/projects-api";
import {
  useCreateProjectMutation,
  useProjectsList,
} from "../components/projects/use-projects-queries";

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
          <HStack gap="1" mt="0.5" flexWrap="wrap">
            <Badge
              size="sm"
              variant="subtle"
              colorPalette="gray"
              fontFamily="mono"
            >
              {project.key}
            </Badge>
            {project.status === "archived" && (
              <Badge size="sm" variant="subtle" colorPalette="gray">
                Archived
              </Badge>
            )}
          </HStack>
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

function EmptyState({
  archived,
  onCreate,
}: {
  archived: boolean;
  onCreate: () => void;
}) {
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
        {archived ? "No archived projects" : "Create your first project"}
      </Heading>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb={archived ? "0" : "8"}
      >
        {archived
          ? "Archived projects are hidden from the active list but not deleted."
          : "Projects keep your team's issues organized. Create one to start tracking work, assigning teammates, and shipping faster."}
      </Text>
      {!archived && (
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
      )}
    </Flex>
  );
}

function ProjectsArchivedToggle({
  archived,
  onChange,
}: {
  archived: boolean;
  onChange: (archived: boolean) => void;
}) {
  const modes = [
    { archived: false, label: "Active" },
    { archived: true, label: "Archived" },
  ] as const;

  return (
    <Box
      position="relative"
      display="inline-flex"
      p="0.5"
      bg="bg.surfaceHover"
      borderRadius="control"
      borderWidth="1px"
      borderColor="border.default"
      flexShrink="0"
    >
      <Box
        position="absolute"
        top="2px"
        bottom="2px"
        left={archived ? "calc(50% + 1px)" : "2px"}
        w="calc(50% - 3px)"
        bg="bg.surface"
        borderRadius="calc(var(--chakra-radii-control) - 2px)"
        boxShadow="subtle"
        transition={`left 0.28s ${EASE_OUT}, box-shadow 0.28s ${EASE_OUT}`}
        pointerEvents="none"
      />
      {modes.map((mode) => {
        const active = archived === mode.archived;
        return (
          <Button
            key={mode.label}
            size="sm"
            variant="ghost"
            position="relative"
            zIndex="1"
            borderRadius="control"
            px="3.5"
            minW="auto"
            h="8"
            bg="transparent"
            color={active ? "fg.primary" : "fg.muted"}
            fontWeight={active ? "semibold" : "medium"}
            transition={transition.base}
            _hover={{ bg: "transparent", color: "fg.primary" }}
            onClick={() => onChange(mode.archived)}
            aria-pressed={active}
          >
            {mode.label}
          </Button>
        );
      })}
    </Box>
  );
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextColorIndex: number;
  orgId: string;
}

function CreateProjectDialog({
  open,
  onOpenChange,
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

  const createMutation = useCreateProjectMutation(orgId);

  const handleCreated = () => {
    reset();
    onOpenChange(false);
    toast.success("Project created");
  };

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
    createMutation.mutate(
      {
        input: {
          name: name.trim(),
          description: description.trim(),
        },
        extras: {
          key: key.trim() || keyFromName(name),
          color: PROJECT_COLORS[nextColorIndex % PROJECT_COLORS.length],
        },
      },
      {
        onSuccess: handleCreated,
        onError: (error) => {
          if (isSessionExpiredError(error)) return;
          toast.error(
            error instanceof CreateProjectError
              ? error.message
              : "Unable to create project"
          );
        },
      }
    );
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const logout = useLogout();
  const navigate = useNavigate();
  const { orgId, orgName, orgsStatus } = useActiveOrg();
  const billingQuery = useBillingSummary(orgId);
  const paymentPastDue = billingQuery.data?.subscription.pastDue === true;
  const projectsQuery = useProjectsList(orgId, archived);
  const projects = projectsQuery.data ?? [];
  const isLoading =
    orgsStatus === "loading" ||
    (Boolean(orgId) && projectsQuery.isPending && !projectsQuery.data);
  const isError =
    Boolean(orgId) && projectsQuery.isError && !projectsQuery.data;
  // const atProjectLimit = projects.length >= FREE_PLAN_PROJECT_LIMIT;

  const listLabel = archived ? "archived project" : "project";
  const subtitle = isLoading
    ? archived
      ? "Loading archived projects…"
      : "Loading projects…"
    : isError
      ? archived
        ? "Couldn't load archived projects"
        : "Couldn't load projects"
      : projects.length === 0
        ? archived
          ? "No archived projects"
          : "No projects yet"
        : `${projects.length} ${listLabel}${projects.length > 1 ? "s" : ""} in ${orgName}`;

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
              {subtitle}
            </Text>
          </Box>
          <HStack gap="3" flexWrap="wrap" justify="flex-end">
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
            <ProjectsArchivedToggle
              archived={archived}
              onChange={setArchived}
            />
            {!archived && !isLoading && !isError && projects.length > 0 && (
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
          {isLoading ? (
            <ProjectsListSkeleton />
          ) : isError ? (
            <ProjectsListErrorState
              onRetry={() => void projectsQuery.refetch()}
            />
          ) : projects.length === 0 ? (
            <EmptyState archived={archived} onCreate={handleNewProjectClick} />
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
        nextColorIndex={projects.length}
        orgId={orgId}
      />
    </Flex>
  );
}
