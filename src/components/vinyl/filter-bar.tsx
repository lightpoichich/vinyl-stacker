"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  genres: string[];
  onFilterChange: (filters: {
    search: string;
    genre: string;
    condition: string;
    yearFrom: string;
    yearTo: string;
  }) => void;
}

export function FilterBar({ genres, onFilterChange }: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [condition, setCondition] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  function emitChange(overrides: Record<string, string> = {}) {
    onFilterChange({
      search,
      genre,
      condition,
      yearFrom,
      yearTo,
      ...overrides,
    });
  }

  function clearFilters() {
    setSearch("");
    setGenre("");
    setCondition("");
    setYearFrom("");
    setYearTo("");
    onFilterChange({
      search: "",
      genre: "",
      condition: "",
      yearFrom: "",
      yearTo: "",
    });
  }

  const hasFilters = search || genre || condition || yearFrom || yearTo;

  return (
    <div className="flex flex-col gap-3">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search your collection..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            emitChange({ search: e.target.value });
          }}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={genre}
          onValueChange={(val) => {
            setGenre(val ?? "");
            emitChange({ genre: val ?? "" });
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Genres</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={condition}
          onValueChange={(val) => {
            setCondition(val ?? "");
            emitChange({ condition: val ?? "" });
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Conditions</SelectItem>
            <SelectItem value="M">Mint</SelectItem>
            <SelectItem value="NM">Near Mint</SelectItem>
            <SelectItem value="VG+">Very Good+</SelectItem>
            <SelectItem value="VG">Very Good</SelectItem>
            <SelectItem value="G+">Good+</SelectItem>
            <SelectItem value="G">Good</SelectItem>
            <SelectItem value="F">Fair</SelectItem>
            <SelectItem value="P">Poor</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="From year"
          value={yearFrom}
          onChange={(e) => {
            setYearFrom(e.target.value);
            emitChange({ yearFrom: e.target.value });
          }}
          className="w-[100px]"
        />

        <Input
          type="number"
          placeholder="To year"
          value={yearTo}
          onChange={(e) => {
            setYearTo(e.target.value);
            emitChange({ yearTo: e.target.value });
          }}
          className="w-[100px]"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
