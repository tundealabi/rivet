import type { InputProps } from "@chakra-ui/react";
import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaUser } from "react-icons/fa";
import { FaBuildingColumns } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { PiNutFill } from "react-icons/pi";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";

import registerImage from "../assets/register/register.png";
import { ApiRequestError, isAuthenticated, registerUser } from "../auth-api";

function LogoMark(props: { size?: number }) {
  return <PiNutFill size={props.size ?? 32} />;
}

function BrandLogo({ color = "fg.primary" }: { color?: string }) {
  return (
    <RouterLink to="/" style={{ textDecoration: "none" }}>
      <HStack gap="2.5">
        <Box
          color={color === "white" ? "white" : "accent.default"}
          lineHeight="0"
        >
          <LogoMark size={30} />
        </Box>
        <Text
          fontSize="xl"
          fontWeight="bold"
          color={color}
          letterSpacing="-0.02em"
        >
          Rivet
        </Text>
      </HStack>
    </RouterLink>
  );
}

function passwordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pw) return { score: 0, label: "", color: "border.default" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "status.error" };
  if (score === 2) return { score: 2, label: "Fair", color: "status.warning" };
  if (score === 3) return { score: 3, label: "Good", color: "status.info" };
  return { score: 4, label: "Strong", color: "status.success" };
}

interface FloatingInputProps extends InputProps {
  label: string;
  error?: string;
  endElement?: ReactNode;
}

function FloatingInput({
  label,
  error,
  endElement,
  ...inputProps
}: FloatingInputProps) {
  return (
    <Field.Root invalid={!!error}>
      <Box position="relative" w="full">
        <Text
          position="absolute"
          top="2"
          left="4"
          fontSize="10px"
          fontWeight="semibold"
          letterSpacing="0.02em"
          color="fg.muted"
          zIndex="1"
          pointerEvents="none"
        >
          {label}
        </Text>
        <InputGroup endElement={endElement}>
          <Input
            h="14"
            pt="4"
            ps="4"
            fontSize="sm"
            fontWeight="medium"
            color="fg.primary"
            bg="bg.surfaceHover"
            borderColor="border.default"
            borderRadius="control"
            _hover={{ borderColor: "fg.muted" }}
            _focus={{
              borderColor: "accent.default",
              bg: "bg.surface",
              boxShadow: "none",
            }}
            {...inputProps}
          />
        </InputGroup>
      </Box>
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  organizationName?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export default function RegisterPage() {
  if (isAuthenticated()) {
    return <Navigate to="/projects" replace />;
  }

  return <RegisterForm />;
}

function RegisterForm() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const strength = useMemo(() => passwordStrength(password), [password]);
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (_data, variables) => {
      toast.success("Your account was created. Please sign in.");
      void navigate("/login", {
        replace: true,
        state: { email: variables.email },
      });
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.fields) {
        setErrors({
          firstName: error.fields.firstName?.[0]?.message,
          lastName: error.fields.lastName?.[0]?.message,
          email: error.fields.email?.[0]?.message,
          organizationName: error.fields.orgName?.[0]?.message,
          password: error.fields.password?.[0]?.message,
        });
      }

      toast.error(
        error instanceof Error ? error.message : "Unable to create your account"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!firstName.trim()) next.firstName = "Please enter your first name";
    if (!lastName.trim()) next.lastName = "Please enter your last name";
    if (!/^\S+@\S+\.\S+$/.test(email))
      next.email = "Please enter a valid email address";
    if (!organizationName.trim())
      next.organizationName = "Please enter your organization name";
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[#?!@$%^&*-.])(?=.{8,})/.test(
        password
      )
    )
      next.password =
        "Use 8+ characters with uppercase, lowercase, a number, and a special character";
    if (confirmPassword !== password)
      next.confirmPassword = "Passwords do not match";
    if (!acceptedTerms) next.terms = "You must accept the terms to continue";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    registerMutation.mutate({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      orgName: organizationName.trim(),
      password,
    });
  };

  return (
    <Flex minH="100svh" bg="bg.canvas">
      {/* Brand panel */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        flex="1"
        direction="column"
        p="12"
        color="white"
        position="relative"
        overflow="hidden"
        backgroundImage={`linear-gradient(135deg, rgba(30, 27, 75, 0.82), rgba(79, 70, 229, 0.45)), url(${registerImage})`}
        backgroundPosition="center"
        backgroundSize="cover"
      >
        <Box zIndex="1">
          <BrandLogo color="white" />
        </Box>

        <Flex flex="1" direction="column" justify="center" zIndex="1">
          <Stack gap="5" maxW="lg">
            <Text
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="0.14em"
              textTransform="uppercase"
            >
              Join for free
            </Text>
            <Heading
              fontSize={{ lg: "4xl", xl: "5xl" }}
              lineHeight="1.2"
              letterSpacing="-0.02em"
              fontWeight="semibold"
            >
              Track every issue,{" "}
              <Box as="span" color="#A5B4FC">
                empower your team
              </Box>
              , ship your best work
            </Heading>
            <Text fontSize="xs" color="whiteAlpha.800" maxW="2xs">
              Get started with the easiest and most secure way to plan, track,
              and ship work across your organization.
            </Text>
          </Stack>
        </Flex>
      </Flex>

      {/* Form panel */}
      <Flex
        flex="1"
        align="center"
        justify="center"
        p={{ base: "6", md: "12" }}
      >
        <Box w="full" maxW="md">
          {/* Mobile logo */}
          <Box
            mb="10"
            display={{ base: "flex", lg: "none" }}
            justifyContent="center"
          >
            <BrandLogo />
          </Box>

          <Heading
            size="3xl"
            color="fg.primary"
            letterSpacing="-0.02em"
            lineHeight="1.15"
            mb="8"
          >
            Create
            <Box as="span" display="block">
              new account
              <Box as="span" color="accent.default">
                .
              </Box>
            </Box>
          </Heading>

          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="4">
              <Stack direction={{ base: "column", sm: "row" }} gap="4">
                <FloatingInput
                  label="First Name"
                  error={errors.firstName}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  endElement={<FaUser size={18} />}
                />
                <FloatingInput
                  label="Last Name"
                  error={errors.lastName}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  endElement={<FaUser size={18} />}
                />
              </Stack>

              <FloatingInput
                label="Email"
                error={errors.email}
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                endElement={<MdEmail size={19} />}
              />

              <FloatingInput
                label="Organisation Name"
                error={errors.organizationName}
                placeholder="Enter your organisation name"
                autoComplete="organization"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                endElement={<FaBuildingColumns size={18} />}
              />

              <Box>
                <FloatingInput
                  label="Password"
                  error={errors.password}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endElement={
                    <Button
                      variant="ghost"
                      size="xs"
                      color="fg.muted"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      type="button"
                    >
                      <FaEye size={18} />
                    </Button>
                  }
                />
                {password && (
                  <HStack gap="2" w="full" mt="2">
                    <HStack gap="1" flex="1">
                      {[1, 2, 3, 4].map((step) => (
                        <Box
                          key={step}
                          h="1"
                          flex="1"
                          borderRadius="full"
                          bg={
                            step <= strength.score
                              ? strength.color
                              : "border.default"
                          }
                          transition="background 0.2s"
                        />
                      ))}
                    </HStack>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      minW="12"
                      textAlign="right"
                    >
                      {strength.label}
                    </Text>
                  </HStack>
                )}
              </Box>

              <FloatingInput
                label="Confirm Password"
                error={errors.confirmPassword}
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Field.Root invalid={!!errors.terms}>
                <Checkbox.Root
                  checked={acceptedTerms}
                  onCheckedChange={(e) => setAcceptedTerms(!!e.checked)}
                  colorPalette="purple"
                  size="sm"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label color="fg.secondary" fontWeight="normal">
                    I agree to the{" "}
                    <Link href="/terms" color="accent.default">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" color="accent.default">
                      Privacy Policy
                    </Link>
                  </Checkbox.Label>
                </Checkbox.Root>
                <Field.ErrorText>{errors.terms}</Field.ErrorText>
              </Field.Root>

              <Text fontSize="sm" color="fg.secondary" textAlign="right">
                Already a member?{" "}
                <Link href="/login" color="accent.default" fontWeight="medium">
                  Log In
                </Link>
              </Text>

              <Button
                type="submit"
                size="lg"
                borderRadius="full"
                bg="accent.default"
                color="white"
                fontWeight="semibold"
                _hover={{ bg: "accent.hover" }}
                loading={registerMutation.isPending}
                loadingText="Creating account..."
              >
                Create Account
              </Button>
            </Stack>
          </form>
        </Box>
      </Flex>
    </Flex>
  );
}
