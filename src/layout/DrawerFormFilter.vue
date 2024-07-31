<template>
    <el-drawer v-model="drawer" :title="title" :with-header="false">

        <el-form :model="form" label-width="auto" style="max-width: 600px" label-position="top">

            <el-form-item :label="t('common.form.filter.orderStatus')">
                <el-checkbox-group v-model="form.orderStatus">
                    <el-checkbox v-for="(label, value) in orderStatusOptions" :key="value" :label="value" :checked="allChecked">
                        {{ label }}
                    </el-checkbox>
                </el-checkbox-group>
                <el-checkbox v-model="allChecked" @change="handleAllCheckedChange">
                {{ t('common.form.filter.loadsStatus.all') }}
                </el-checkbox>
            </el-form-item>


            <el-form-item label="Activity zone">
                <el-select v-model="form.region" placeholder="please select your zone">
                    <el-option label="Zone one" value="shanghai" />
                    <el-option label="Zone two" value="beijing" />
                </el-select>
            </el-form-item>

            <el-form-item :label="t('common.form.filter.selectPeriod')">
                    <el-date-picker
        v-model="form.date1"
        type="daterange"
        :range-separator="t('common.words.to')"
        :start-placeholder="t('common.form.filter.startDate')"
        :end-placeholder="t('common.form.filter.endDate')"
      />
            </el-form-item>

            <el-form-item label="Instant delivery">
                <el-switch v-model="form.delivery" />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" :loading="loading" @click="onSubmit">
                {{ loading ? 'Submitting ...' : 'Submit' }}
                </el-button>
                <el-button @click="resetForm">Effacer</el-button>
            </el-form-item>

        </el-form>

    </el-drawer>
</template>

<script lang="ts" setup>

import { ElDrawer } from 'element-plus';
import { reactive, ref, watch } from 'vue'
import { i18n } from "@/locales";

const t = i18n.global.t;

const props = defineProps<{
    title: string
}>()

const allChecked = ref(false);

const orderStatusOptions = {
    toCover: t('common.form.filter.loadsStatus.toCover'),
    charter: t('common.form.filter.loadsStatus.charter'),
    emptyTruck: t('common.form.filter.loadsStatus.emptyTruck'),
    Loaded: t('common.form.filter.loadsStatus.loaded'),
    forwarding: t('common.form.filter.loadsStatus.forwarding'),
    delivered: t('common.form.filter.loadsStatus.delivered')
};

const handleAllCheckedChange = () => {
    form.orderStatus = allChecked.value ? Object.keys(orderStatusOptions) : [];
};

const drawer = ref(false);
const loading = ref(false);
let timer: number | undefined;

const form = reactive({
    name: "",
    region: "",
    date1: "",
    date2: "",
    delivery: false,
    type: [],
    resource: "",
    desc: "",
    orderStatus: [] as string[] // Utiliser un tableau pour stocker les valeurs des cases à cocher
});

const onSubmit = () => {
    loading.value = true;
    // Simulating async submission with a timer
    timer = setTimeout(() => {
        loading.value = false;
        // Perform actual submission here, e.g., API call
        // On success, you can close the drawer and reset the form
        // ElMessage.success('Form submitted successfully');
        // resetForm();
    }, 2000);

};

const resetForm = () => {
    // Resetting form fields
    form.name = "";
    form.region = "";
    form.date1 = "";
    form.date2 = "";
    form.delivery = false;
    form.type = [];
    form.resource = "";
    form.desc = "";
};
</script>
```