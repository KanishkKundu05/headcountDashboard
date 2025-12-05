/**
 * LinkedIn company input used in the employee table empty state.
 *
 * Renders a shadcn InputGroup where the user types the company slug
 * (e.g. "example") and we compose the full LinkedIn URL as:
 * https://www.linkedin.com/company/{slug}
 */
"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

interface LinkedinCompanyInputProps {
  onSubmit: (companyUrl: string) => void
  loading?: boolean
}

export function LinkedinCompanyInput({
  onSubmit,
  loading = false,
}: LinkedinCompanyInputProps) {
  const [value, setValue] = React.useState("")

  function handleSubmit() {
    const slug = value.trim()
    if (!slug || loading) return

    const companyUrl = `https://www.linkedin.com/company/${slug}`
    onSubmit(companyUrl)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSubmit()
    }
  }

  if (loading) {
    return (
      <InputGroup data-disabled>
        <InputGroupInput
          placeholder="Searching..."
          disabled
          value={value}
        />
        <InputGroupAddon align="inline-end">
          <Spinner />
        </InputGroupAddon>
      </InputGroup>
    )
  }

  return (
    <InputGroup>
      <InputGroupInput
        placeholder="joinwarp"
        className="!pl-1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="LinkedIn company slug"
      />
      <InputGroupAddon>
        <InputGroupText>https://www.linkedin.com/company/</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          className="rounded-full"
          size="icon-xs"
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          aria-label="Search LinkedIn company"
        >
          <ArrowRight className="h-3 w-3" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}


