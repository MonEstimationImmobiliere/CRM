<template>
  <ElAutoResizer>
    <template #default="{ height, width }">
      <el-table-v2
        :columns="columns"
        :data="addresses"
        :width="width"
        :height="height"
        fixed
        row-key="id_fantoir_long"
        @row-click="handleRowClick"
      />
    </template>
  </ElAutoResizer>
</template>

<script setup lang="ts">
import { h, computed } from "vue";
import {
  ElTableV2,
  ElAutoResizer,
} from "element-plus";

import { Star, StarFilled, House, OfficeBuilding, QuestionFilled } from "@element-plus/icons-vue";

import soleil from "@/assets/soleil.png";
import soleilNuage from "@/assets/soleil-nuage.png";
import nuage from "@/assets/nuage.png";
import nuagePluie from "@/assets/nuage-pluie.png";
import orage from "@/assets/orage.png";

import { usePropertyStore } from "@/stores/propertyHome";
import { useDashboardStore } from "@/stores/dashboard";
import { ElMessage } from "element-plus";

const props = defineProps({
  addresses: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["edit-property"]);

const store = usePropertyStore();
const dashboardStore = useDashboardStore();

/* ---------------------------------------------------
      FONCTIONS UTILITAIRES
----------------------------------------------------*/
function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`;
}

function formatPrice(value: number | null) {
  if (!value) return "";
  return `${Math.round(value).toLocaleString("fr-FR")} €`;
}

function formatMetrage(value: number | null) {
  if (!value) return "";
  return `${Math.round(value).toLocaleString("fr-FR")} m²`;
}

function getMonthsDiff(dateRappel: string | null): number {
  if (!dateRappel) return -1;
  const rappel = new Date(dateRappel);
  const now = new Date();
  return (
    (now.getFullYear() - rappel.getFullYear()) * 12 +
    (now.getMonth() - rappel.getMonth())
  );
}

function getWeatherIcon(dateRappel: string | null): string {
  const diff = getMonthsDiff(dateRappel);
  if (diff < 0 || diff < 1) return soleil;
  if (diff < 3) return soleilNuage;
  if (diff < 6) return nuage;
  if (diff < 12) return nuagePluie;
  return orage;
}

function getWeatherLabel(dateRappel: string | null): string {
  const diff = getMonthsDiff(dateRappel);
  if (diff < 0) return "Immediat";
  if (diff < 1) return "Immediat";
  if (diff < 3) return "1 mois";
  if (diff < 6) return "3 mois";
  if (diff < 12) return "6 mois";
  return "A eviter";
}

/* ---------------------------------------------------
      FAVORI
----------------------------------------------------*/
const toggleFavorite = async (row: any) => {
  try {
    const newState = await store.toggleFavorite(row.id_fantoir_long, row);

    row.favorite = newState ? "true" : "false";

    dashboardStore.updateAddress({
      ...row,
      favorite: row.favorite,
    });

    ElMessage.success(
      newState ? "Ajouté aux favoris" : "Retiré des favoris"
    );
  } catch (e) {
    console.error("toggleFavorite error:", e);
    ElMessage.error("Impossible de modifier le favori");
  }
};

/* ---------------------------------------------------
      OUVERTURE FICHE
----------------------------------------------------*/
const handleRowClick = (row: any) => {
  emit("edit-property", row);
};

/* ---------------------------------------------------
      RENDERS POUR CHAQUE COLONNE
----------------------------------------------------*/

function renderType(row: any) {
  let icon = QuestionFilled;
  if (row.type_bien === "Maison") icon = House;
  else if (row.type_bien === "Appartement") icon = OfficeBuilding;
  else if (row.type_bien === "Immeuble") icon = OfficeBuilding;

  return h("div", { style: "display:flex;align-items:center;gap:4px;" }, [
    h(icon, { style: "font-size:20px;" }),
    row.apart_number ? h("span", {}, `/${row.apart_number}`) : null,
  ]);
}

/* ---------------------------------------------------
      COLONNES DU TABLEAU VIRTUALISÉ
----------------------------------------------------*/
const columns = computed(() => [
  {
    key: "ville",
    title: "Ville",
    width: 160,
    cellRenderer: ({ rowData }: any) =>
      `${rowData.nom_commune} ${rowData.codePostal}`,
  },
  {
    key: "numero",
    title: "N°",
    width: 80,
    cellRenderer: ({ rowData }: any) =>
      `${rowData.numero} ${rowData.rep || ""}`,
  },
  {
    key: "rue",
    title: "Rue",
    width: 200,
    cellRenderer: ({ rowData }: any) => rowData.nom_voie,
  },
  {
    key: "type",
    title: "Type",
    width: 120,
    cellRenderer: ({ rowData }: any) => renderType(rowData),
  },
  {
    key: "surface",
    title: "Surface",
    width: 100,
    cellRenderer: ({ rowData }: any) => formatMetrage(rowData.surface),
  },
  {
    key: "date_vente",
    title: "Dernière vente",
    width: 120,
    cellRenderer: ({ rowData }: any) =>
      formatDate(rowData.date_derniere_vente),
  },
  {
    key: "prix_vendu",
    title: "Prix vendu",
    width: 120,
    cellRenderer: ({ rowData }: any) =>
      formatPrice(rowData.dernier_prix_vente),
  },
  {
    key: "prix_estime",
    title: "Prix estimé",
    width: 120,
    cellRenderer: ({ rowData }: any) =>
      formatPrice(rowData.price || rowData.dernier_prix_estime),
  },
  {
    key: "contact",
    title: "Contact",
    width: 160,
    cellRenderer: ({ rowData }: any) =>
      h("div", { style: "display:flex;align-items:center;gap:6px;" }, [
        h("img", {
          src: getWeatherIcon(rowData.date_rappel),
          width: 24,
          height: 24,
        }),
        h(
          "span",
          {
            style: `
              color:${
                getWeatherLabel(rowData.date_rappel).includes("eviter")
                  ? "red"
                  : getWeatherLabel(rowData.date_rappel).includes("mois")
                  ? "orange"
                  : "green"
              }
            `,
          },
          getWeatherLabel(rowData.date_rappel)
        ),
      ]),
  },
  {
    key: "actions",
    title: "Actions",
    width: 140,
    fixed: "right",
    cellRenderer: ({ rowData }: any) =>
      h("div", { class: "action-buttons" }, [
        h(
          "button",
          {
            class: "fav-btn",
            onClick: () => toggleFavorite(rowData),
          },
          rowData.favorite === "true"
            ? h(StarFilled)
            : h(Star)
        ),
        h(
          "button",
          {
            class: "open-btn",
            onClick: () => emit("edit-property", rowData),
          },
          "Ouvrir"
        ),
      ]),
  },
]);
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.fav-btn,
.open-btn {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: #fff;
}

.fav-btn:hover,
.open-btn:hover {
  background: #eee;
}
</style>
