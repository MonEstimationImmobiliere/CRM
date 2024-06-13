import type { StoryFn, StoryObj } from "@storybook/vue3";
import { ref, shallowRef } from "vue";

import SbButton from "../SbButton/SbButton.vue";
import SbDialog from "./SbDialog.vue";

export default {
  title: "Component/SbDialog",
  component: SbDialog
};

const DefaultTemplate: StoryFn<typeof SbDialog> = (args) => ({
  components: {
    SbDialog,
    SbButton
  },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);

    return { args, isDialogOpen };
  },
  template: `
    <SbButton @click="isDialogOpen = true">Open</SbButton>
    <SbDialog v-model="isDialogOpen" v-bind="args">Here is a good looking dialog</SbDialog>
  `
});

export const Default = {
  render: DefaultTemplate,

  args: {
    title: "A dialog"
  }
};

export const WithSubtitle = {
  render: DefaultTemplate,

  args: {
    title: "A dialog with a subtitle",
    subtitle: "Here it is the good looking subtitle"
  }
};

const WithFooterTemplate: StoryFn<typeof SbDialog> = (args) => ({
  components: {
    SbDialog,
    SbButton
  },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);

    return { args, isDialogOpen };
  },
  template: `
    <SbButton @click="isDialogOpen = true">Open</SbButton>
    <SbDialog v-model="isDialogOpen" v-bind="args">
      Here is a good looking dialog
      <template #footer>
        This is a footer
      </template>
    </SbDialog>
  `
});

export const WithFooter: StoryObj<typeof SbDialog> = {
  render: WithFooterTemplate,

  args: {
    title: "A dialog with a footer"
  }
};

const ScrollableTemplate: StoryFn<typeof SbDialog> = (args) => ({
  components: {
    SbDialog,
    SbButton
  },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);

    return { args, isDialogOpen };
  },
  template: `
    <SbButton @click="isDialogOpen = true">Open</SbButton>
    <SbDialog v-model="isDialogOpen" v-bind="args">
      Officia occaecat anim officia sit commodo Lorem exercitation amet est. Lorem velit do pariatur esse sunt nisi esse tempor aliquip duis cillum laborum pariatur. Consectetur labore enim commodo labore nisi id minim fugiat in. Aliquip magna sit deserunt dolor laborum commodo. Minim elit pariatur adipisicing ad adipisicing.
      <br/><br/>
      Ipsum anim magna pariatur dolore dolore. Esse nisi deserunt nulla incididunt qui ea ut et ea. Aute mollit amet ad elit et adipisicing exercitation ea reprehenderit. Nulla dolore cillum id mollit ex. Eiusmod cillum anim quis sunt adipisicing proident irure id irure quis culpa incididunt Lorem. Consequat ullamco cillum est excepteur. Reprehenderit ut quis exercitation labore exercitation in laboris aliquip exercitation eu reprehenderit ex.
      <br/><br/>
      Incididunt pariatur excepteur ea qui eiusmod adipisicing est consectetur irure duis proident. Enim elit sit velit incididunt ea ullamco exercitation elit. Anim tempor duis magna aute et laboris commodo irure qui velit tempor ut non. Voluptate voluptate labore non pariatur nostrud aliquip do ullamco ipsum. Do aute veniam eu fugiat.
      <br/><br/>
      Nostrud do duis esse aliqua Lorem esse id consequat. Officia excepteur minim elit id. Nisi magna amet enim sit est consequat eiusmod eu minim. Ullamco occaecat enim et aliquip.
      <br/><br/>
      Nostrud qui in veniam consectetur id velit duis nostrud eiusmod qui fugiat adipisicing. Magna occaecat proident sint nostrud id fugiat sint excepteur laboris amet sit cupidatat aliqua cillum. Labore pariatur consequat commodo sit officia culpa mollit laborum dolor aliquip minim id adipisicing commodo.
      <br/><br/>
      Occaecat aute est nostrud fugiat minim consectetur et. Nisi ex enim id ad nisi est velit. Minim est enim dolore amet nulla ex aliquip eu quis. Dolor eiusmod consectetur ex eu duis ut. Cillum consequat fugiat anim ad cillum cupidatat officia non eiusmod.
      <br/><br/>
      Dolor irure veniam voluptate nulla ea ex cupidatat magna. Laboris sunt commodo id occaecat ex dolor incididunt occaecat et duis duis cupidatat aute amet. Exercitation ad nulla eiusmod sunt ex pariatur minim labore. Est ad eu eiusmod exercitation veniam enim non laboris tempor reprehenderit enim non esse eiusmod. Officia officia aliquip ut minim magna laboris proident minim occaecat labore excepteur.
      <br/><br/>
      Lorem laboris quis laborum nisi duis deserunt laboris labore. Ex velit nulla non pariatur reprehenderit cillum elit ea incididunt do. Labore duis esse in laborum pariatur anim dolor pariatur consequat eu ea dolore do.
      <br/><br/>
      Cupidatat sit commodo ipsum dolor ullamco amet laboris magna amet eu ex aute enim. Do elit nisi est id ut ad ullamco incididunt. Ad sunt enim non laboris consequat dolor nisi voluptate aute non. Nostrud deserunt duis excepteur laborum veniam consectetur voluptate tempor tempor eiusmod.
      <br/><br/>
      Laboris sint elit est culpa pariatur ea esse cupidatat esse quis nisi veniam. Laboris dolor excepteur id sunt consequat nisi velit fugiat aute irure ullamco anim eu amet. Dolore in minim excepteur dolore nostrud veniam ut incididunt consectetur aliquip. Ea laborum mollit voluptate pariatur labore ea est ex aliquip.
      <br/><br/>
      Sint sunt ipsum ipsum aliquip ad. Et officia nostrud culpa duis enim nisi et aute sit tempor anim ex. Irure occaecat magna do adipisicing labore reprehenderit. Amet ut dolore laboris cillum sunt minim in enim labore velit ut reprehenderit.
      <template #footer>
        This is a footer
      </template>
    </SbDialog>
  `
});

export const Scrollable = {
  render: ScrollableTemplate,

  args: {
    title: "A scrollable dialog",
    subtitle: "A subtitle of a scrollable dialog"
  }
};

export const FullHeight = {
  render: ScrollableTemplate,

  args: {
    title: "A full height dialog",
    fullHeight: true
  }
};

const WithDynamicHeaderContentTemplate: StoryFn<typeof SbDialog> = (args) => ({
  components: {
    SbDialog,
    SbButton
  },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);
    const sbDialogRef = shallowRef();

    const setInSubTitle = args.setInSubTitle;
    delete args.setInSubTitle;

    const handleDialogOpened = () => {
      const { elements, setAutoTitleWhenElementDisappear, setAutoSubtitleWhenElementDisappear } =
        sbDialogRef.value;
      const setInDialogHeaderEl = elements.body.querySelector("#set-in-dialog-header");
      if (setInSubTitle) return setAutoSubtitleWhenElementDisappear(setInDialogHeaderEl);
      return setAutoTitleWhenElementDisappear(setInDialogHeaderEl);
    };

    return { args, isDialogOpen, sbDialogRef, handleDialogOpened };
  },
  template: `
    <SbButton @click="isDialogOpen = true">Open</SbButton>
    <SbDialog
      v-model="isDialogOpen"
      v-bind="args"
      ref="sbDialogRef"
      @opened="handleDialogOpened"
    >
      Officia occaecat anim officia sit commodo Lorem exercitation amet est. Lorem velit do pariatur esse sunt nisi esse tempor aliquip duis cillum laborum pariatur. Consectetur labore enim commodo labore nisi id minim fugiat in. Aliquip magna sit deserunt dolor laborum commodo. Minim elit pariatur adipisicing ad adipisicing.
      <br/><br/>
      Ipsum anim magna pariatur dolore dolore. Esse nisi deserunt nulla incididunt qui ea ut et ea. Aute mollit amet ad elit et adipisicing exercitation ea reprehenderit. Nulla dolore cillum id mollit ex. Eiusmod cillum anim quis sunt adipisicing proident irure id irure quis culpa incididunt Lorem. Consequat ullamco cillum est excepteur. Reprehenderit ut quis exercitation labore exercitation in laboris aliquip exercitation eu reprehenderit ex.
      <br/><br/>
      Incididunt pariatur excepteur ea qui eiusmod adipisicing est consectetur irure duis proident. Enim elit sit velit incididunt ea ullamco exercitation elit. Anim tempor duis magna aute et laboris commodo irure qui velit tempor ut non. Voluptate voluptate labore non pariatur nostrud aliquip do ullamco ipsum. Do aute veniam eu fugiat.
      <br/><br/>
      <b id="set-in-dialog-header">To be set in the header</b>
      <br/><br/>
      Nostrud do duis esse aliqua Lorem esse id consequat. Officia excepteur minim elit id. Nisi magna amet enim sit est consequat eiusmod eu minim. Ullamco occaecat enim et aliquip.
      <br/><br/>
      Nostrud qui in veniam consectetur id velit duis nostrud eiusmod qui fugiat adipisicing. Magna occaecat proident sint nostrud id fugiat sint excepteur laboris amet sit cupidatat aliqua cillum. Labore pariatur consequat commodo sit officia culpa mollit laborum dolor aliquip minim id adipisicing commodo.
      <br/><br/>
      Occaecat aute est nostrud fugiat minim consectetur et. Nisi ex enim id ad nisi est velit. Minim est enim dolore amet nulla ex aliquip eu quis. Dolor eiusmod consectetur ex eu duis ut. Cillum consequat fugiat anim ad cillum cupidatat officia non eiusmod.
      <br/><br/>
      Dolor irure veniam voluptate nulla ea ex cupidatat magna. Laboris sunt commodo id occaecat ex dolor incididunt occaecat et duis duis cupidatat aute amet. Exercitation ad nulla eiusmod sunt ex pariatur minim labore. Est ad eu eiusmod exercitation veniam enim non laboris tempor reprehenderit enim non esse eiusmod. Officia officia aliquip ut minim magna laboris proident minim occaecat labore excepteur.
      <br/><br/>
      Lorem laboris quis laborum nisi duis deserunt laboris labore. Ex velit nulla non pariatur reprehenderit cillum elit ea incididunt do. Labore duis esse in laborum pariatur anim dolor pariatur consequat eu ea dolore do.
      <br/><br/>
      Cupidatat sit commodo ipsum dolor ullamco amet laboris magna amet eu ex aute enim. Do elit nisi est id ut ad ullamco incididunt. Ad sunt enim non laboris consequat dolor nisi voluptate aute non. Nostrud deserunt duis excepteur laborum veniam consectetur voluptate tempor tempor eiusmod.
      <br/><br/>
      Laboris sint elit est culpa pariatur ea esse cupidatat esse quis nisi veniam. Laboris dolor excepteur id sunt consequat nisi velit fugiat aute irure ullamco anim eu amet. Dolore in minim excepteur dolore nostrud veniam ut incididunt consectetur aliquip. Ea laborum mollit voluptate pariatur labore ea est ex aliquip.
      <br/><br/>
      Sint sunt ipsum ipsum aliquip ad. Et officia nostrud culpa duis enim nisi et aute sit tempor anim ex. Irure occaecat magna do adipisicing labore reprehenderit. Amet ut dolore laboris cillum sunt minim in enim labore velit ut reprehenderit.
      <template #footer>
        This is a footer
      </template>
    </SbDialog>
  `
});

export const WithDynamicTitle = {
  render: WithDynamicHeaderContentTemplate,

  args: {
    title: "A dialog with dynamic title",
    subtitle: "A subtitle of a scrollable dialog"
  }
};

export const WithDynamicSubtitle = {
  render: WithDynamicHeaderContentTemplate,

  args: {
    setInSubTitle: true,
    title: "A dialog with a dynamic subtitle",
    subtitle: "A subtitle which will be replaced automagically"
  }
};

const WithHeaderEndTemplate: StoryFn<typeof SbDialog> = (args) => ({
  components: {
    SbDialog,
    SbButton
  },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);
    return { args, isDialogOpen };
  },
  template: `
    <SbButton @click="isDialogOpen = true">Open</SbButton>
    <SbDialog v-model="isDialogOpen" v-bind="args" title="My awesome dialog">
      <template #header-end>
        <SbButton>My button in the header end</SbButton>
      </template>
      Here is a dialog with content in the #header-end slot
    </SbDialog>
  `
});

export const WithHeaderEnd = {
  render: WithHeaderEndTemplate,
  args: {}
};

const WithCustomHeaderTemplate: StoryFn<typeof SbDialog> = (args) => ({
  components: {
    SbDialog,
    SbButton
  },
  mounted() {
    this.isDialogOpen = true;
  },
  setup() {
    const isDialogOpen = ref(false);
    return { args, isDialogOpen };
  },
  template: `
    <SbButton @click="isDialogOpen = true">Open</SbButton>
    <SbDialog v-model="isDialogOpen" v-bind="args">
      <template #header>
        <SbButton>My button in the header template</SbButton>
      </template>
      Here is a dialog with complete custom header template
    </SbDialog>
  `
});

export const WithCustomHeader = {
  render: WithCustomHeaderTemplate,
  args: {}
};
