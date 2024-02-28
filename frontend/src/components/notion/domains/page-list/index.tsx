import { invariant } from "@suimenkathemove/utils";
import { memo, useCallback, useEffect } from "react";
import {
  Tree,
  moveNode,
  removeNode,
  updateNode,
} from "react-notion-sortable-tree";

import {
  SortableTree,
  SortableTreeProps,
} from "@/components/notion/domains/sortable-tree";
import { usePageTree } from "@/global-states/page-tree";
import {
  MoveTargetType,
  Page,
  useAddPageMutation,
  useListChildrenPagesLazyQuery,
  useListRootPagesLazyQuery,
  useMovePageMutation,
  useRemovePageMutation,
  useUpdatePageMutation,
} from "@/graphql/generated";
import { Result } from "@/types";

// TODO: fix props
export interface PageListProps {
  result: Result<{ pages: Pick<Page, "id" | "title">[] }>;
  onClickAddPage: () => void;
  // TODO: value object
  onClickRemovePageButton: (id: string) => void;
}

type Data = {
  title: string;
};

export const PageList = memo((_props: PageListProps) => {
  const { pageTree: tree, setPageTree: setTree } = usePageTree();

  const [listRootPages] = useListRootPagesLazyQuery();
  const [listChildrenPages] = useListChildrenPagesLazyQuery();
  const [addPage] = useAddPageMutation();
  const [updatePage] = useUpdatePageMutation();
  const [removePage] = useRemovePageMutation();
  const [movePage] = useMovePageMutation();

  useEffect(() => {
    void (async () => {
      const result = await listRootPages();
      invariant(
        result.data?.listRootPages.__typename === "ListPages",
        "TODO: error handling",
      );
      const newTree: Tree<Data> = result.data.listRootPages.items.map((r) => ({
        id: r.id,
        children: [],
        collapsed: true,
        data: {
          title: r.title,
        },
      }));
      setTree(newTree);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClickCollapse: SortableTreeProps["onClickCollapse"] = useCallback(
    async (item) => {
      if (item.collapsed) {
        const result = await listChildrenPages({ variables: { id: item.id } });
        invariant(
          result.data?.listChildrenPages.__typename === "ListPages",
          "TODO: error handling",
        );
        const children = result.data.listChildrenPages.items;
        const newTree = updateNode(tree, item.id, (node) => ({
          ...node,
          children: children.map((c) => ({
            id: c.id,
            children: [],
            collapsed: true,
            data: {
              title: c.title,
            },
          })),
          collapsed: false,
        }));
        setTree(newTree);
      } else {
        const newTree = updateNode(tree, item.id, (node) => ({
          ...node,
          collapsed: true,
        }));
        setTree(newTree);
      }
    },
    [listChildrenPages, setTree, tree],
  );

  const onClickAddRoot: SortableTreeProps["onClickAddRoot"] =
    useCallback(async () => {
      const result = await addPage({
        variables: { parentId: null, addPage: { title: "", text: "" } },
      });
      invariant(
        result.data?.addPage.__typename === "Page",
        "TODO: error handling",
      );
      const newTree: Tree<Data> = tree.concat({
        id: result.data.addPage.id,
        children: [],
        collapsed: true,
        data: {
          title: "",
        },
      });
      setTree(newTree);
    }, [addPage, setTree, tree]);

  const onClickAddChild: SortableTreeProps["onClickAddChild"] = useCallback(
    async (id) => {
      const result = await addPage({
        variables: { parentId: id, addPage: { title: "", text: "" } },
      });
      invariant(
        result.data?.addPage.__typename === "Page",
        "TODO: error handling",
      );
      const newNode = result.data.addPage;
      const newTree = updateNode(tree, id, (node) => ({
        ...node,
        children: node.children.concat({
          id: newNode.id,
          children: [],
          collapsed: true,
          data: {
            title: "",
          },
        }),
        collapsed: false,
      }));
      setTree(newTree);
    },
    [addPage, setTree, tree],
  );

  const onClickRename: SortableTreeProps["onClickRename"] = useCallback(
    async (item) => {
      const value = window.prompt("", item.data.title) ?? "";
      await updatePage({
        variables: { id: item.id, updatePage: { title: value } },
      });
      const newTree = updateNode(tree, item.id, (node) => ({
        ...node,
        data: {
          title: value,
        },
      }));
      setTree(newTree);
    },
    [setTree, tree, updatePage],
  );

  const onClickDelete: SortableTreeProps["onClickDelete"] = useCallback(
    async (id) => {
      await removePage({ variables: { id } });
      const [newTree] = removeNode(tree, id);
      setTree(newTree);
    },
    [removePage, setTree, tree],
  );

  const onMove: SortableTreeProps["onMove"] = useCallback(
    async (fromItem, target) => {
      const moveTarget = (() => {
        switch (target.type) {
          case "parent":
            return { type: MoveTargetType.Parent, id: target.id };
          case "siblingParent":
            return { type: MoveTargetType.SiblingParent, id: target.id };
          case "siblingChild":
            return { type: MoveTargetType.SiblingChild, id: target.id };
          default:
            // TODO: satisfies never
            return null;
        }
      })();
      await movePage({
        // TODO: remove any
        variables: { id: fromItem.id, target: moveTarget as any },
      });
      const newTree = moveNode(tree, fromItem.id, target);
      setTree(newTree);
    },
    [movePage, setTree, tree],
  );

  return (
    <SortableTree
      tree={tree}
      onClickCollapse={onClickCollapse}
      onClickAddRoot={onClickAddRoot}
      onClickAddChild={onClickAddChild}
      onClickRename={onClickRename}
      onClickDelete={onClickDelete}
      onMove={onMove}
    />
  );
});
