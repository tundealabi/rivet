import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiLock, PiUsers } from "react-icons/pi";

import type { TeamMember } from "../issues/issue-types";
import { EASE_OUT } from "../issues/issues-motion";
import { canDeleteProject, canManageProject } from "./project-permissions";
import type { Project, ProjectVisibility } from "./project-types";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box py="8">
      <Heading
        size="sm"
        color="fg.primary"
        mb={description ? "1" : "5"}
        letterSpacing="-0.01em"
      >
        {title}
      </Heading>
      {description && (
        <Text fontSize="sm" color="fg.secondary" mb="5" lineHeight="1.6">
          {description}
        </Text>
      )}
      {children}
    </Box>
  );
}

function SettingsDivider() {
  return <Box h="1px" bg="border.divider" />;
}

function PermissionDeniedState({
  onSwitchToIssues,
}: {
  onSwitchToIssues: () => void;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py="24"
      px="6"
    >
      <Flex
        boxSize="14"
        align="center"
        justify="center"
        borderRadius="full"
        bg="bg.surfaceHover"
        color="fg.muted"
        mb="5"
      >
        <PiLock size={28} />
      </Flex>
      <Heading size="md" color="fg.primary" mb="2" letterSpacing="-0.02em">
        You don&apos;t have permission
      </Heading>
      <Text
        fontSize="sm"
        color="fg.secondary"
        maxW="sm"
        mb="8"
        lineHeight="1.6"
      >
        Project settings are only available to organization admins and owners.
      </Text>
      <Button
        borderRadius="control"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        _hover={{ bg: "accent.hover" }}
        onClick={onSwitchToIssues}
      >
        Back to Issues
      </Button>
    </Flex>
  );
}

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void;
}

function ArchiveConfirmDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
}: ArchiveConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
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
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Archive project</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
              Archive{" "}
              <Text as="span" fontWeight="semibold" color="fg.primary">
                {projectName}
              </Text>
              ? Archived projects are hidden from the active list but not
              deleted.
            </Text>
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
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Archive project
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!open) setConfirmName("");
  }, [open]);

  const matches = confirmName.trim() === projectName;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
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
          animation={`rivet-scale-in 0.28s ${EASE_OUT} both`}
        >
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">Delete project</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="5">
            <Stack gap="4">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                This permanently deletes all issues and comments in{" "}
                <Text as="span" fontWeight="semibold" color="fg.primary">
                  {projectName}
                </Text>
                . Cannot be undone.
              </Text>
              <Field.Root>
                <Field.Label color="fg.primary">
                  Type{" "}
                  <Text as="span" fontFamily="mono">
                    {projectName}
                  </Text>{" "}
                  to confirm
                </Field.Label>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  borderRadius="control"
                  autoFocus
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
              bg="status.error"
              color="white"
              _hover={{ bg: "red.600" }}
              disabled={!matches}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Delete project
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface ProjectSettingsTabProps {
  project: Project;
  role: OrganizationRole;
  teamMembers: TeamMember[];
  onProjectChange: (patch: Partial<Project>) => void;
  onArchive: () => void;
  onDelete: () => void;
  onSwitchToIssues: () => void;
}

export function ProjectSettingsTab({
  project,
  role,
  teamMembers,
  onProjectChange,
  onArchive,
  onDelete,
  onSwitchToIssues,
}: ProjectSettingsTabProps) {
  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.key);
  const [description, setDescription] = useState(project.description);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setName(project.name);
    setKey(project.key);
    setDescription(project.description);
  }, [project.id, project.name, project.key, project.description]);

  const canManage = canManageProject(role);
  const canDelete = canDeleteProject(role);

  const isDirty = useMemo(
    () =>
      name.trim() !== project.name ||
      key.trim().toUpperCase() !== project.key ||
      description.trim() !== project.description,
    [name, key, description, project.name, project.key, project.description]
  );

  const keyChanged = key.trim().toUpperCase() !== project.key;

  if (!canManage) {
    return <PermissionDeniedState onSwitchToIssues={onSwitchToIssues} />;
  }

  const handleSaveGeneral = () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    onProjectChange({
      name: name.trim(),
      key: key.trim().toUpperCase() || project.key,
      description: description.trim(),
    });
    toast.success("Project settings saved");
  };

  const handleVisibilityChange = (visibility: ProjectVisibility) => {
    if (visibility === project.visibility) return;
    onProjectChange({ visibility });
    toast.success(
      visibility === "public"
        ? "Project is now visible to all org members"
        : "Project is now invite-only"
    );
  };

  const handleDefaultAssigneeChange = (value: string) => {
    const next = value === "" ? null : value;
    if (next === project.defaultAssignee) return;
    onProjectChange({ defaultAssignee: next });
    toast.success(
      next ? `Default assignee set to ${next}` : "Default assignee cleared"
    );
  };

  return (
    <Box maxW="2xl">
      <SettingsSection title="General">
        <Stack gap="4">
          <Field.Root>
            <Field.Label color="fg.primary">Project name</Field.Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              borderRadius="control"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label color="fg.primary">Project key</Field.Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 5))}
              fontFamily="mono"
              maxW="32"
              borderRadius="control"
            />
            <Field.HelperText color="fg.muted">
              Used as a prefix for issue IDs, e.g. {key || "KEY"}-42
            </Field.HelperText>
            {keyChanged && (
              <Text
                fontSize="sm"
                color="status.warning"
                mt="2"
                lineHeight="1.5"
              >
                Changing the project key updates issue ID prefixes. Existing
                links using {project.key}-* may break.
              </Text>
            )}
          </Field.Root>

          <Field.Root>
            <Field.Label color="fg.primary">Description</Field.Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              borderRadius="control"
              rows={5}
              resize="vertical"
              placeholder="What is this project about?"
            />
          </Field.Root>

          <Flex justify="flex-start">
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              fontWeight="semibold"
              _hover={{ bg: "accent.hover" }}
              disabled={!isDirty}
              onClick={handleSaveGeneral}
            >
              Save changes
            </Button>
          </Flex>
        </Stack>
      </SettingsSection>

      <SettingsDivider />

      <SettingsSection
        title="Visibility & access"
        description="Control who can discover this project and how new issues are assigned."
      >
        <Stack gap="5">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="3">
              Project visibility
            </Text>
            <HStack gap="3" flexWrap="wrap">
              <Button
                variant={project.visibility === "public" ? "solid" : "outline"}
                size="sm"
                borderRadius="control"
                bg={
                  project.visibility === "public" ? "accent.default" : undefined
                }
                color={
                  project.visibility === "public" ? "white" : "fg.secondary"
                }
                borderColor="border.default"
                _hover={{
                  bg:
                    project.visibility === "public"
                      ? "accent.hover"
                      : "bg.surfaceHover",
                }}
                onClick={() => handleVisibilityChange("public")}
              >
                <PiUsers size={16} />
                Public to org
              </Button>
              <Button
                variant={project.visibility === "private" ? "solid" : "outline"}
                size="sm"
                borderRadius="control"
                bg={
                  project.visibility === "private"
                    ? "accent.default"
                    : undefined
                }
                color={
                  project.visibility === "private" ? "white" : "fg.secondary"
                }
                borderColor="border.default"
                _hover={{
                  bg:
                    project.visibility === "private"
                      ? "accent.hover"
                      : "bg.surfaceHover",
                }}
                onClick={() => handleVisibilityChange("private")}
              >
                <PiLock size={16} />
                Private
              </Button>
            </HStack>
            <Text fontSize="xs" color="fg.muted" mt="2" lineHeight="1.5">
              {project.visibility === "public"
                ? "All organization members can see this project and its issues."
                : "Only invited members can access this project."}
            </Text>
          </Box>

          <Field.Root maxW="sm">
            <Field.Label color="fg.primary">
              Default assignee{" "}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (optional)
              </Text>
            </Field.Label>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                borderRadius="control"
                value={project.defaultAssignee ?? ""}
                onChange={(e) => handleDefaultAssigneeChange(e.target.value)}
              >
                <option value="">None</option>
                {teamMembers.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Field.HelperText color="fg.muted">
              New issues in this project will be assigned to this person by
              default.
            </Field.HelperText>
          </Field.Root>
        </Stack>
      </SettingsSection>

      <SettingsDivider />

      <Box
        py="8"
        px="5"
        borderWidth="1px"
        borderColor="red.200"
        borderRadius="card"
        bg="danger.ghostHover"
        css={{
          "@media (prefers-color-scheme: dark)": {
            bg: "rgba(127, 29, 29, 0.12)",
          },
        }}
      >
        <Heading size="sm" color="status.error" mb="1" letterSpacing="-0.01em">
          Danger zone
        </Heading>
        <Text fontSize="sm" color="fg.secondary" mb="6" lineHeight="1.6">
          Irreversible or high-impact actions for this project.
        </Text>

        <Stack gap="6">
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap="4"
          >
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" color="fg.primary" mb="1">
                Archive project
              </Text>
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
                Archived projects are hidden but not deleted.
              </Text>
            </Box>
            <Button
              variant="outline"
              borderRadius="control"
              borderColor="border.default"
              color="fg.primary"
              fontWeight="medium"
              flexShrink="0"
              disabled={project.status === "archived"}
              onClick={() => setArchiveOpen(true)}
            >
              {project.status === "archived"
                ? "Already archived"
                : "Archive project"}
            </Button>
          </Flex>

          {canDelete && (
            <>
              <Box h="1px" bg="red.200" />
              <Flex
                direction={{ base: "column", sm: "row" }}
                align={{ base: "stretch", sm: "center" }}
                justify="space-between"
                gap="4"
              >
                <Box flex="1">
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="fg.primary"
                    mb="1"
                  >
                    Delete project
                  </Text>
                  <Text fontSize="sm" color="fg.secondary" lineHeight="1.5">
                    This permanently deletes all issues and comments. Cannot be
                    undone.
                  </Text>
                </Box>
                <Button
                  borderRadius="control"
                  bg="status.error"
                  color="white"
                  fontWeight="medium"
                  flexShrink="0"
                  _hover={{ bg: "red.600" }}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete project
                </Button>
              </Flex>
            </>
          )}
        </Stack>
      </Box>

      <ArchiveConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        projectName={project.name}
        onConfirm={onArchive}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectName={project.name}
        onConfirm={onDelete}
      />
    </Box>
  );
}
