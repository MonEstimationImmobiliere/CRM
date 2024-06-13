import type { StoryFn } from "@storybook/vue3";

import { useForm } from "@confero/common/hooks/useForm";

import SbButton from "../SbButton/SbButton.vue";
import SbFormItem from "../SbFormItem/SbFormItem.vue";
import SbInput from "../SbInput/SbInput.vue";
import SbForm from "./SbForm.vue";

export default {
  title: "Component/SbForm",
  component: SbForm
};

const DefaultTemplate: StoryFn<typeof SbForm> = (args) => ({
  components: {
    SbInput,
    SbForm,
    SbFormItem,
    SbButton
  },
  setup() {
    const { formModel, formRef, resetForm, validateForm, formRules } = useForm(() => {
      return {
        email: "",
        firstname: ""
      };
    });

    return { args, formModel, resetForm, formRef, validateForm, formRules };
  },
  template: `
    <SbForm ref="formRef" :rules="formRules" :model="formModel">
      <SbFormItem label="E-mail address" prop="email">
        <SbInput v-model="formModel.email" placeholder="Your e-mail address"/>
      </SbFormItem>
      <SbFormItem label="First name" prop="firstname">
        <SbInput v-model="formModel.firstname" placeholder="Your first name"/>
      </SbFormItem>
      <SbButton @click="resetForm">Reset</SbButton>
      <SbButton @click="validateForm">Validate</SbButton>
    </SbForm>
  `
});

export const Default = {
  render: DefaultTemplate
};

const WithValidationTemplate = (args) => ({
  components: {
    SbInput,
    SbForm,
    SbFormItem,
    SbButton
  },
  setup() {
    const { formRules, formModel, formRef, resetForm, validateForm } = useForm(
      () => {
        return {
          email: "",
          firstname: ""
        };
      },
      {
        email: {
          type: "email",
          message: "Ce champs doit être de type email",
          required: true
        },
        firstname: {
          required: true,
          message: "Ce champ est requis"
        }
      }
    );

    return { args, formRules, formModel, resetForm, formRef, validateForm };
  },
  template: `
    <SbForm ref="formRef" :rules="formRules" :model="formModel">
      <SbFormItem label="E-mail address" prop="email">
        <SbInput v-model="formModel.email" placeholder="Your e-mail address"/>
      </SbFormItem>
      <SbFormItem label="First name" prop="firstname">
        <SbInput v-model="formModel.firstname" placeholder="Your first name"/>
      </SbFormItem>
      <SbButton @click="resetForm">Reset</SbButton>
      <SbButton @click="validateForm">Validate</SbButton>
    </SbForm>
  `
});

export const WithValidation = {
  render: WithValidationTemplate
};
