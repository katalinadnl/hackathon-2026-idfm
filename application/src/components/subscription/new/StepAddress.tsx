import { ActivityIndicator, Text, View, Pressable } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/Section";
import { DS } from "@/constants/theme";
import type { Department } from "@/lib/api/departments";
import { FieldLabel } from "./FieldLabel";
import { StepActions } from "./StepActions";
import { s } from "./styles";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function StepAddress({
  departments,
  departmentsLoading,
  departmentsError,
  onReloadDepartments,
  residenceDept,
  workDept,
  errors,
  onResidenceDeptChange,
  onWorkDeptChange,
  onBack,
  onContinue,
}: {
  departments: Department[];
  departmentsLoading: boolean;
  departmentsError: string | null;
  onReloadDepartments: () => void;
  residenceDept: string | null;
  workDept: string | null;
  errors: Record<string, string>;
  onResidenceDeptChange: (code: string) => void;
  onWorkDeptChange: (code: string | null) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={s.section}>
      <SectionTitle>Adresse</SectionTitle>

      <Text style={s.noteText}>
        Sélectionnez votre département de résidence et, si applicable, votre
        département de travail ou d&apos;études.
      </Text>

      {departmentsLoading && (
        <View style={s.inlineLoading}>
          <ActivityIndicator color={DS.actionPrimary} />
          <Text style={s.noteText}>Chargement des départements…</Text>
        </View>
      )}

      {!departmentsLoading && departmentsError && (
        <View style={s.inlineError}>
          <Icon name="alert-triangle" size={16} color={DS.dangerText} />
          <Text style={s.inlineErrorText}>{departmentsError}</Text>
          <Button size="sm" variant="secondary" onPress={onReloadDepartments}>
            Réessayer
          </Button>
        </View>
      )}

      {!departmentsLoading && !departmentsError && (
        <>
          <View style={s.deptField}>
            <DepartmentSearchInput
              label="Département de résidence"
              departments={departments}
              value={residenceDept}
              onChange={(code) => onResidenceDeptChange(code ?? "")}
              placeholder="Nom ou numéro du département"
              error={errors.residenceDept}
            />
          </View>

          <View style={s.deptField}>
            <DepartmentSearchInput
              label="Département de travail / d'études (optionnel)"
              departments={departments}
              value={workDept}
              onChange={onWorkDeptChange}
              placeholder="Nom ou numéro du département"
              clearable
            />
          </View>
        </>
      )}

      <StepActions onBack={onBack} onContinue={onContinue} />
    </View>
  );
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function DepartmentSearchInput({
  departments,
  value,
  onChange,
  placeholder = "Nom ou numéro du département",
  error,
  clearable,
  label,
}: {
  departments: Department[];
  value: string | null;
  onChange: (code: string | null) => void;
  placeholder?: string;
  error?: string;
  clearable?: boolean;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const selected = useMemo(
    () => departments.find((d) => d.code === value) ?? null,
    [departments, value],
  );

  const results = useMemo(() => {
    if (!query.trim()) return departments.slice(0, 8);
    const q = normalize(query);
    return departments
      .filter(
        (d) => normalize(d.code).includes(q) || normalize(d.name).includes(q),
      )
      .slice(0, 8);
  }, [departments, query]);

  function handleSelect(d: Department) {
    onChange(d.code);
    setQuery("");
    setFocused(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
  }

  // Le dropdown n'est PAS en position absolue : il pousse le contenu suivant
  // vers le bas. C'est plus fiable en RN (pas de souci de zIndex/overflow
  // coupé par un ScrollView ou un conteneur frère) et ça reste lisible sur
  // mobile puisque chaque champ est dans son propre bloc.
  const showDropdown = focused && results.length > 0;

  return (
    <View>
      {selected ? (
        <View>
          <FieldLabel>{label}</FieldLabel>
          <View style={s.deptSelectedRow}>
            <Card style={s.deptSelectedChip}>
              <Text style={s.deptSelectedLabel}>
                {selected.code} – {selected.name}
              </Text>
              {clearable && (
                <Pressable
                  onPress={handleClear}
                  accessibilityRole="button"
                  accessibilityLabel="Retirer"
                  hitSlop={8}
                >
                  <Icon name="x" size={16} color={DS.textMuted} />
                </Pressable>
              )}
            </Card>
            {!clearable && (
              <Pressable
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Modifier"
                hitSlop={8}
              >
                <Text style={s.deptChangeLink}>Modifier</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View>
          <Input
            label={label}
            placeholder={placeholder}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            error={error}
            leadingIcon="search"
          />

          {showDropdown && (
            <Card style={s.deptDropdown}>
              {results.map((d) => (
                <Pressable
                  key={d.code}
                  onPress={() => handleSelect(d)}
                  style={s.deptDropdownRow}
                >
                  <Text style={s.deptDropdownCode}>{d.code}</Text>
                  <Text style={s.deptDropdownName}>{d.name}</Text>
                </Pressable>
              ))}
            </Card>
          )}
        </View>
      )}

      {!selected && !!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}
